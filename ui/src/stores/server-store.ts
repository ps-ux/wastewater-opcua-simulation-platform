// Zustand store for server state management

import { create } from 'zustand';
import type { ServerState, SimulationMode, HealthStatus } from '@/lib/types';
import { serverApi, simulationApi, healthApi } from '@/lib/api';

interface ServerStore {
  // State
  serverState: ServerState | null;
  health: HealthStatus | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchServerState: () => Promise<void>;
  fetchHealth: () => Promise<void>;
  startServer: () => Promise<void>;
  stopServer: () => Promise<void>;
  restartServer: () => Promise<void>;
  setSimulationMode: (mode: SimulationMode) => Promise<void>;
  resetSimulation: () => Promise<void>;
  clearError: () => void;
}

export const useServerStore = create<ServerStore>((set, get) => ({
  serverState: null,
  health: null,
  isLoading: false,
  error: null,

  fetchServerState: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await serverApi.getStatus();
      set({ serverState: response.data, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch server state',
        isLoading: false
      });
    }
  },

  fetchHealth: async () => {
    try {
      const response = await healthApi.check();
      set({ health: response.data });
    } catch {
      set({
        health: {
          status: 'unhealthy',
          opcua_server: false,
          database: false,
          simulation_running: false,
          pump_count: 0,
          chamber_count: 0
        }
      });
    }
  },

  startServer: async () => {
    set({ isLoading: true, error: null });
    try {
      await serverApi.start();
      await get().fetchServerState();
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to start server',
        isLoading: false
      });
    }
  },

  stopServer: async () => {
    set({ isLoading: true, error: null });
    try {
      await serverApi.stop();
      await get().fetchServerState();
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to stop server',
        isLoading: false
      });
    }
  },

  restartServer: async () => {
    set({ isLoading: true, error: null });
    try {
      await serverApi.restart();
      await get().fetchServerState();
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to restart server',
        isLoading: false
      });
    }
  },

  setSimulationMode: async (mode: SimulationMode) => {
    set({ isLoading: true, error: null });
    try {
      await simulationApi.setMode(mode);
      await get().fetchServerState();
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to set simulation mode',
        isLoading: false
      });
    }
  },

  resetSimulation: async () => {
    set({ isLoading: true, error: null });
    try {
      await simulationApi.reset();
      await get().fetchServerState();
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to reset simulation',
        isLoading: false
      });
    }
  },

  clearError: () => set({ error: null }),
}));
