// Zustand store for pump state management

import { create } from 'zustand';
import type { PumpData } from '@/lib/types';
import { pumpsApi, type PumpInfo } from '@/lib/api';

interface PumpStore {
  // State
  pumps: PumpInfo[];
  pumpData: Record<string, PumpData>;
  selectedPumpId: string | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchPumps: () => Promise<void>;
  updatePumpData: (pumpId: string, data: Partial<PumpData>) => void;
  selectPump: (pumpId: string | null) => void;
  startPump: (pumpId: string) => Promise<void>;
  stopPump: (pumpId: string) => Promise<void>;
  setSpeed: (pumpId: string, rpm: number) => Promise<void>;
  resetFault: (pumpId: string) => Promise<void>;
  startAllPumps: () => Promise<void>;
  stopAllPumps: () => Promise<void>;
  startAllIPSPumps: () => Promise<void>;
  clearError: () => void;
}

export const usePumpStore = create<PumpStore>((set, get) => ({
  pumps: [],
  pumpData: {},
  selectedPumpId: null,
  isLoading: false,
  error: null,

  fetchPumps: async () => {
    set({ isLoading: true, error: null });
    try {
      const pumps = await pumpsApi.getAll();
      set({ pumps, isLoading: false });

      // Initialize pump data with defaults
      const pumpData: Record<string, PumpData> = {};
      for (const pump of pumps) {
        pumpData[pump.id] = createDefaultPumpData(pump.id, pump.name);
      }
      set({ pumpData });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch pumps',
        isLoading: false
      });
    }
  },

  updatePumpData: (pumpId: string, data: Partial<PumpData>) => {
    set(state => ({
      pumpData: {
        ...state.pumpData,
        [pumpId]: {
          ...state.pumpData[pumpId],
          ...data
        }
      }
    }));
  },

  selectPump: (pumpId: string | null) => {
    set({ selectedPumpId: pumpId });
  },

  startPump: async (pumpId: string) => {
    set({ isLoading: true, error: null });
    try {
      await pumpsApi.start(pumpId);
      set({ isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to start pump',
        isLoading: false
      });
    }
  },

  stopPump: async (pumpId: string) => {
    set({ isLoading: true, error: null });
    try {
      await pumpsApi.stop(pumpId);
      set({ isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to stop pump',
        isLoading: false
      });
    }
  },

  setSpeed: async (pumpId: string, rpm: number) => {
    set({ isLoading: true, error: null });
    try {
      await pumpsApi.setSpeed(pumpId, rpm);
      set({ isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to set pump speed',
        isLoading: false
      });
    }
  },

  resetFault: async (pumpId: string) => {
    set({ isLoading: true, error: null });
    try {
      await pumpsApi.resetFault(pumpId);
      // Update local state to reflect fault reset
      const currentData = get().pumpData[pumpId];
      if (currentData) {
        set(state => ({
          pumpData: {
            ...state.pumpData,
            [pumpId]: { ...currentData, is_faulted: false }
          },
          isLoading: false
        }));
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to reset pump fault',
        isLoading: false
      });
    }
  },

  startAllPumps: async () => {
    set({ isLoading: true, error: null });
    try {
      await pumpsApi.startAll();
      set({ isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to start all pumps',
        isLoading: false
      });
    }
  },

  stopAllPumps: async () => {
    set({ isLoading: true, error: null });
    try {
      await pumpsApi.stopAll();
      set({ isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to stop all pumps',
        isLoading: false
      });
    }
  },

  startAllIPSPumps: async () => {
    set({ isLoading: true, error: null });
    try {
      const { pumps } = get();
      // Filter for IPS pumps (IDs starting with "IPS_PMP_")
      const ipsPumps = pumps.filter(pump => pump.id.startsWith('IPS_PMP_'));
      
      // Start each IPS pump sequentially
      for (const pump of ipsPumps) {
        // Skip if already running or faulted
        const pumpData = get().pumpData[pump.id];
        if (pumpData && (pumpData.is_running || pumpData.is_faulted)) {
          continue;
        }
        await pumpsApi.start(pump.id);
      }
      set({ isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to start IPS pumps',
        isLoading: false
      });
    }
  },

  clearError: () => set({ error: null }),
}));

function createDefaultPumpData(id: string, name: string): PumpData {
  return {
    id,
    name,
    is_running: false,
    is_faulted: false,
    flow_rate: 0,
    suction_pressure: 0,
    discharge_pressure: 0,
    rpm: 0,
    motor_current: 0,
    voltage: 0,
    power_consumption: 0,
    power_factor: 0,
    vfd_frequency: 0,
    motor_winding_temp: 25,
    bearing_temp_de: 25,
    bearing_temp_nde: 25,
    seal_chamber_temp: 25,
    ambient_temp: 25,
    vibration_de_h: 0,
    vibration_de_v: 0,
    vibration_de_a: 0,
    vibration_nde_h: 0,
    vibration_nde_v: 0,
    vibration_nde_a: 0,
    runtime_hours: 0,
    start_count: 0,
    wet_well_level: 4,
    alarms: []
  };
}
