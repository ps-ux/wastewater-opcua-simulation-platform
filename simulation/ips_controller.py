import logging
import math
from typing import Dict, List, Optional
from datetime import datetime
from .pump import PumpSimulation
from .chamber import ChamberSimulation
from .modes import get_diurnal_multiplier

_logger = logging.getLogger('simulation.ips_controller')

class IPSController:
    """
    Rock Creek Influent Pump Station Controller.
    
    Manages:
    1. Wet Well Physics (North & South)
    2. SCADA Auto Logic (Level Control)
    """

    def __init__(self):
        self.pumps: Dict[str, PumpSimulation] = {}
        self.wet_wells: Dict[str, ChamberSimulation] = {}
        
        # Physics Parameters
        self.base_inflow_mgd = 20.0  # Average Dry Weather Flow
        self.current_inflow_mgd = 0.0
        
        # Dimensions (approximate based on design intent)
        # 103 ft elevation is target. Floor is 88 ft. 
        # Area needs to be sized such that 20 MGD doesn't fill it instantly.
        # 20 MGD = ~1200 cfm. 
        self.wet_well_area_sqft = 800.0 # Total area (split North/South)
        
        # SCADA Setpoints (Elevation in Feet)
        self.setpoint_level = 103.0
        self.start_lead_level = 103.5
        self.start_lag_level = 104.0
        self.stop_pump_level = 102.5
        self.all_stop_level = 99.75
        
        # Derived
        self.north_level = 103.0
        self.south_level = 103.0
        
        # Sequence State
        self.pump_sequence = ['IPS_PMP_001', 'IPS_PMP_004', 'IPS_PMP_006', 'IPS_PMP_002', 'IPS_PMP_005', 'IPS_PMP_007', 'IPS_PMP_003']
        self.running_pumps: List[str] = []

    def register_asset(self, asset):
        """Register pumps or chambers to the controller."""
        if isinstance(asset, PumpSimulation):
            if "IPS_PMP" in asset.asset_id:
                self.pumps[asset.asset_id] = asset
        elif isinstance(asset, ChamberSimulation):
            if "IPS_WW" in asset.asset_id:
                self.wet_wells[asset.asset_id] = asset

    def tick(self, dt: float):
        """Main control loop tick."""
        self._update_physics(dt)
        self._run_scada_logic(dt)

    def _update_physics(self, dt: float):
        """Simulate inflow and level changes."""
        # 1. Calculate Inflow (Diurnal)
        hour = datetime.now().hour
        multiplier = get_diurnal_multiplier(hour)
        self.current_inflow_mgd = self.base_inflow_mgd * multiplier
        
        # Convert MGD to cubic feet per second (cfs)
        # 1 MGD = 1.547 cfs
        inflow_cfs = self.current_inflow_mgd * 1.547
        
        # 2. Calculate Outflow (Total Pump Flow)
        total_outflow_cfs = 0.0
        for pump in self.pumps.values():
            if pump.is_running:
                # Pump flow is in m3/h in simulation, need to convert or normalize.
                # Let's assume the pump simulation returns consistent units if configured correctly.
                # assets.json Large pump = 5440 m3/h = ~34.5 MGD.
                # simulation/pump.py calculates flow in m3/h.
                # 1 m3/h = 0.00038 MGD.
                flow_mgd = pump.get_state().get('flow_rate', 0) * 0.00038
                total_outflow_cfs += flow_mgd * 1.547

        # 3. Mass Balance
        net_flow_cfs = inflow_cfs - total_outflow_cfs
        
        # Split flow to North/South (simplified hydraulic connectivity)
        # We assume they equalize or receive equal flow.
        # Change in level = Net Flow / Area
        delta_h = (net_flow_cfs * dt) / self.wet_well_area_sqft
        
        self.north_level += delta_h
        self.south_level += delta_h
        
        # Clamp Levels
        self.north_level = max(88.0, min(120.0, self.north_level))
        self.south_level = max(88.0, min(120.0, self.south_level))
        
        # Update Pump Objects (so they know suction head)
        # Level in pump properties is usually relative depth (0-10m).
        # We map Elevation (88-122) to Depth (0-34).
        north_depth_m = (self.north_level - 88.0) * 0.3048
        south_depth_m = (self.south_level - 88.0) * 0.3048
        
        for pid, pump in self.pumps.items():
            if pid in ['IPS_PMP_001', 'IPS_PMP_002', 'IPS_PMP_003', 'IPS_PMP_004']:
                pump.set_wet_well_level(north_depth_m)
            else:
                pump.set_wet_well_level(south_depth_m)

    def _run_scada_logic(self, dt: float):
        """
        SCADA Auto Logic.
        Goal: Maintain level at 103.0 ft.
        """
        # Average level for control
        avg_level = (self.north_level + self.south_level) / 2.0
        
        # 1. Low Level Protection (Shutdown)
        if avg_level <= self.all_stop_level:
            for pid in self.running_pumps:
                self._stop_pump(pid)
            return

        # 2. Staging Logic
        # DISABLED: Automatic pump starting - pumps now start only on user action
        # If level is high, start next pump
        # if avg_level > self.start_lag_level:
        #     if not self._is_ramping(): # Don't start another if one is still ramping up
        #         next_pump = self._get_next_available_pump()
        #         if next_pump:
        #             self._start_pump(next_pump)
        
        # If level is low (but above shutdown), stop last pump
        # DISABLED: Automatic pump stopping - pumps now stop only on user action
        # elif avg_level < self.stop_pump_level:
        #      if self.running_pumps and not self._is_ramping():
        #          last_pump = self.running_pumps[-1]
        #          self._stop_pump(last_pump)

        # 3. PID / Speed Control
        # Simple Proportional Control for now
        # Error = Level - Setpoint
        # Output = Base Speed + (Kp * Error)
        error = avg_level - self.setpoint_level
        
        # Target speed percent (0.60 - 1.00)
        # 103 ft -> 60%
        # 104 ft -> 90%
        # Slope = 0.30 / 1.0 ft = 0.3
        
        base_speed = 0.60
        target_speed_pct = base_speed + (error * 0.3)
        target_speed_pct = max(0.60, min(1.00, target_speed_pct))
        
        for pid in self.running_pumps:
            pump = self.pumps[pid]
            
            # Constraint: South pumps (5, 6, 7) limited to 90%
            current_target = target_speed_pct
            if pid in ['IPS_PMP_005', 'IPS_PMP_006', 'IPS_PMP_007']:
                current_target = min(0.90, current_target)
                
            # Convert % to RPM
            max_rpm = pump.design_specs.get('MaxRPM', 900)
            rpm_setpoint = max_rpm * current_target
            
            # Apply to pump
            if not pump.is_faulted:
                pump.set_speed(rpm_setpoint)

    def _get_next_available_pump(self) -> Optional[str]:
        for pid in self.pump_sequence:
            if pid not in self.running_pumps:
                pump = self.pumps.get(pid)
                if pump and not pump.is_faulted and not pump.is_running:
                    return pid
        return None

    def _start_pump(self, pid: str):
        if pid not in self.running_pumps:
            _logger.info(f"SCADA: Starting {pid} (Level High)")
            # In a real engine, we'd await this, but tick is sync here usually.
            # We rely on the pump object handling 'start' state update immediately or next tick.
            # Since simulation engine calls tick async, we might need a way to schedule async calls.
            # For now, we assume direct method calls on pump object work or we flag it.
            # We will use the async start method but scheduled as task if needed, 
            # OR just set the state directly since we are the controller.
            # PumpSimulation.start() is async.
            # We should probably run it in the event loop or use a non-async interface if possible.
            # BUT, PumpSimulation.start *is* async.
            # Hack: modify state directly for simulation physics.
            self.pumps[pid].is_running = True
            self.pumps[pid].target_rpm = self.pumps[pid].design_specs.get('MinRPM', 600) # Start at min
            self.pumps[pid].start_count += 1
            self.running_pumps.append(pid)

    def _stop_pump(self, pid: str):
        if pid in self.running_pumps:
            _logger.info(f"SCADA: Stopping {pid} (Level Low)")
            self.pumps[pid].is_running = False
            self.pumps[pid].target_rpm = 0
            self.running_pumps.remove(pid)

    def _is_ramping(self) -> bool:
        """Check if any pump is currently ramping up (to prevent rapid staging)."""
        # Simplified: if any running pump is significantly below target, assume ramping.
        for pid in self.running_pumps:
             pump = self.pumps[pid]
             if abs(pump.current_rpm - pump.target_rpm) > 50:
                 return True
        return False
