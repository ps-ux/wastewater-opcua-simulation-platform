// API client for OPC-UA Pump Simulation Server

import axios from 'axios';
import type {
  ServerState,
  SimulationMode,
  FailureType,
  Asset,
  AssetTemplate,
  HealthStatus,
  AgedConfig,
  DegradedConfig,
  FailureConfig,
} from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Server Control
export const serverApi = {
  getStatus: () => api.get<ServerState>('/api/server/status'),
  start: () => api.post('/api/server/start'),
  stop: () => api.post('/api/server/stop'),
  restart: () => api.post('/api/server/restart'),
};

// Simulation Control
export const simulationApi = {
  getMode: () => api.get<{ mode: SimulationMode; interval_ms: number; time_acceleration: number }>('/api/simulation/mode'),

  setMode: (mode: SimulationMode) =>
    api.post('/api/simulation/mode', { mode }),

  getConfig: () =>
    api.get<{ aged: AgedConfig; degraded: DegradedConfig; failure: FailureConfig }>('/api/simulation/config'),

  updateConfig: (config: {
    aged?: Partial<AgedConfig>;
    degraded?: Partial<DegradedConfig>;
    failure?: Partial<FailureConfig>;
  }) => api.put('/api/simulation/config', config),

  reset: () => api.post('/api/simulation/reset'),

  triggerFailure: (failureType: FailureType) =>
    api.post('/api/simulation/trigger-failure', { failure_type: failureType }),
};

// Assets
export const assetsApi = {
  getAll: () => api.get<Asset[]>('/api/assets'),
  getTree: () => api.get<Asset[]>('/api/assets/tree'),
  getById: (id: string) => api.get<Asset>(`/api/assets/${id}`),
  create: (asset: Partial<Asset>) => api.post<Asset>('/api/assets', asset),
  update: (id: string, asset: Partial<Asset>) => api.put<Asset>(`/api/assets/${id}`, asset),
  delete: (id: string) => api.delete(`/api/assets/${id}`),
};

// Templates
export const templatesApi = {
  getAll: () => api.get<AssetTemplate[]>('/api/templates'),
  getById: (id: string) => api.get<AssetTemplate>(`/api/templates/${id}`),
  create: (template: Partial<AssetTemplate>) => api.post<AssetTemplate>('/api/templates', template),
  update: (id: string, template: Partial<AssetTemplate>) =>
    api.put<AssetTemplate>(`/api/templates/${id}`, template),
  delete: (id: string) => api.delete(`/api/templates/${id}`),
};

// Health
export const healthApi = {
  check: () => api.get<HealthStatus>('/api/health'),
};

// Pumps (custom endpoints for real-time data)
export interface PumpInfo {
  id: string;
  name: string;
  displayName: string;
  type: string;
  browsePath: string;
  hierarchyPath: string;
  isRunning?: boolean;
  isFaulted?: boolean;
}

export const pumpsApi = {
  getAll: async (): Promise<PumpInfo[]> => {
    const response = await api.get('/api/pumps');
    return response.data.map((a: {
      asset_id: string;
      display_name: string;
      name: string;
      type_name: string;
      browse_path: string;
      hierarchy_path: string;
      is_running?: boolean;
      is_faulted?: boolean;
    }) => ({
      id: a.asset_id,
      name: a.name,
      displayName: a.display_name || a.name,
      type: a.type_name,
      browsePath: a.browse_path,
      hierarchyPath: a.hierarchy_path,
      isRunning: a.is_running,
      isFaulted: a.is_faulted,
    }));
  },

  getById: (pumpId: string) =>
    api.get(`/api/pumps/${pumpId}`),

  start: (pumpId: string) =>
    api.post(`/api/pumps/${pumpId}/start`),

  stop: (pumpId: string) =>
    api.post(`/api/pumps/${pumpId}/stop`),

  setSpeed: (pumpId: string, rpm: number) =>
    api.post(`/api/pumps/${pumpId}/speed`, { rpm }),

  resetFault: (pumpId: string) =>
    api.post(`/api/pumps/${pumpId}/reset-fault`),

  startAll: () =>
    api.post('/api/pumps/start-all'),

  stopAll: () =>
    api.post('/api/pumps/stop-all'),
};
