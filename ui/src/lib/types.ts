// Type definitions for OPC-UA Pump Simulation UI

export type SimulationMode = 'OPTIMAL' | 'AGED' | 'DEGRADED' | 'FAILURE';
export type FailureType = 'NONE' | 'BEARING' | 'SEAL' | 'CAVITATION' | 'IMPELLER' | 'MOTOR';
export type ServerStatus = 'running' | 'stopped' | 'error' | 'starting';

export interface ServerState {
  status: ServerStatus;
  simulation_mode: SimulationMode;
  simulation_interval_ms: number;
  time_acceleration: number;
  diurnal_enabled: boolean;
  aged_config: AgedConfig;
  degraded_config: DegradedConfig;
  failure_config: FailureConfig;
  flow_profile: FlowProfile;
}

export interface AgedConfig {
  years: number;
  hours_per_year: number;
  starts_per_year: number;
}

export interface DegradedConfig {
  impeller_wear: number;
  bearing_wear: number;
  seal_wear: number;
}

export interface FailureConfig {
  type: FailureType;
  progression: number;
  time_to_failure: number;
}

export interface FlowProfile {
  base: number;
  peak: number;
  peak_hour_1: number;
  peak_hour_2: number;
}

export interface PumpData {
  id: string;
  name: string;
  is_running: boolean;
  is_faulted: boolean;

  // Flow
  flow_rate: number;

  // Pressure
  suction_pressure: number;
  discharge_pressure: number;

  // VFD/Electrical
  rpm: number;
  motor_current: number;
  voltage: number;
  power_consumption: number;
  power_factor: number;
  vfd_frequency: number;

  // Temperature
  motor_winding_temp: number;
  bearing_temp_de: number;
  bearing_temp_nde: number;
  seal_chamber_temp: number;
  ambient_temp: number;

  // Vibration
  vibration_de_h: number;
  vibration_de_v: number;
  vibration_de_a: number;
  vibration_nde_h: number;
  vibration_nde_v: number;
  vibration_nde_a: number;

  // Counters
  runtime_hours: number;
  start_count: number;

  // Wet well (for influent pumps)
  wet_well_level?: number;

  // Alarms
  alarms?: AlarmState[];
}

export interface AlarmState {
  name: string;
  active: boolean;
  severity: number;
  message: string;
  timestamp?: string;
}

export interface Asset {
  id: string;
  name: string;
  asset_type: string;
  parent_id: string;
  simulate: boolean;
  properties?: Record<string, unknown>;
  design_specs?: Record<string, number>;
}

export interface AssetTemplate {
  id: string;
  name: string;
  asset_type: string;
  is_default: boolean;
  config: Record<string, unknown>;
}

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  opcua_server: boolean;
  database: boolean;
  simulation_running: boolean;
  pubsub_status: boolean;
  pump_count: number;
  chamber_count: number;
  timestamp?: string;
}
