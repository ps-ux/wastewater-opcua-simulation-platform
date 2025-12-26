// WebSocket hook for real-time pump data

import { useEffect, useCallback, useState } from 'react';
import { usePumpStore } from '@/stores/pump-store';
import type { PumpData } from '@/lib/types';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://127.0.0.1:8080/ws/pumps';

interface WebSocketMessage {
  type: 'initial_state' | 'bulk_update' | 'pump_update';
  data: Record<string, PumpData>;
  pump_id?: string;
  timestamp: string;
}

// Singleton state to share connection across all hook instances
const getGlobalState = () => {
  if (typeof window === 'undefined') return { ws: null, isConnected: false, isConnecting: false, error: null, listeners: new Set() };
  const win = window as any;
  if (!win.__PUMP_WS_STATE__) {
    win.__PUMP_WS_STATE__ = {
      ws: null,
      isConnected: false,
      isConnecting: false,
      error: null,
      listeners: new Set<() => void>()
    };
  }
  return win.__PUMP_WS_STATE__;
};

function notifyListeners() {
  const state = getGlobalState();
  state.listeners.forEach((l: any) => l());
}

export function usePumpWebSocket() {
  const globalState = getGlobalState();
  const [isConnected, setIsConnected] = useState(globalState.isConnected);
  const [error, setError] = useState(globalState.error);

  const connect = useCallback(() => {
    const state = getGlobalState();

    // Prevent multiple connection attempts
    if (state.isConnecting) return;
    if (state.ws && (state.ws.readyState === WebSocket.CONNECTING || state.ws.readyState === WebSocket.OPEN)) {
      return;
    }

    try {
      console.log('Connecting to WebSocket:', WS_URL);
      state.isConnecting = true;
      state.error = null;
      notifyListeners();

      const ws = new WebSocket(WS_URL);
      state.ws = ws;

      ws.onopen = () => {
        console.log('WebSocket connected to', WS_URL);
        state.isConnected = true;
        state.isConnecting = false;
        state.error = null;
        notifyListeners();
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);

          if (message.type === 'initial_state' || message.type === 'bulk_update') {
            const store = usePumpStore.getState();
            Object.entries(message.data).forEach(([pumpId, data]) => {
              store.updatePumpData(pumpId, data);
            });
          } else if (message.type === 'pump_update' && message.pump_id) {
            usePumpStore.getState().updatePumpData(message.pump_id, message.data[message.pump_id]);
          }
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
        }
      };

      ws.onerror = (event) => {
        // Don't log to console.error to avoid Next.js error overlay loops
        console.warn('WebSocket error observed');
        state.error = 'WebSocket connection error';
        state.isConnecting = false;
        notifyListeners();
      };

      ws.onclose = (event) => {
        console.log('WebSocket closed:', event.code, event.reason);
        state.isConnected = false;
        state.isConnecting = false;
        state.ws = null;
        notifyListeners();

        // Attempt to reconnect after 3 seconds
        setTimeout(() => {
          const currentState = getGlobalState();
          if (!currentState.ws && !currentState.isConnecting) {
            console.log('Attempting to reconnect...');
            connect();
          }
        }, 3000);
      };
    } catch (err) {
      console.error('Failed to create WebSocket:', err);
      state.error = 'Failed to create WebSocket connection';
      state.isConnected = false;
      state.isConnecting = false;
      notifyListeners();
    }
  }, []);

  const disconnect = useCallback(() => {
    const state = getGlobalState();
    if (state.ws) {
      state.ws.close();
      state.ws = null;
    }
    state.isConnected = false;
    state.isConnecting = false;
    notifyListeners();
  }, []);

  const sendMessage = useCallback((message: object) => {
    const state = getGlobalState();
    if (state.ws && state.ws.readyState === WebSocket.OPEN) {
      state.ws.send(JSON.stringify(message));
    }
  }, []);

  useEffect(() => {
    const state = getGlobalState();
    const listener = () => {
      setIsConnected(state.isConnected);
      setError(state.error);
    };
    state.listeners.add(listener);

    // Initial connection if needed
    if (!state.ws && !state.isConnecting) {
      connect();
    }

    return () => {
      state.listeners.delete(listener);
    };
  }, [connect]);

  return {
    isConnected,
    error,
    connect,
    disconnect,
    sendMessage,
  };
}
