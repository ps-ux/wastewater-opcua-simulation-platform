"""Pump simulation class.

Simulates all 27 data points for a centrifugal pump including:
- Flow measurement
- Pressure measurements (suction, discharge)
- VFD/Electrical data (RPM, current, voltage, power, frequency)
- Temperature measurements (motor, bearings, seal)
- Vibration measurements (6-axis)
- Runtime counters
- Discrete status

Supports simulation modes: OPTIMAL, AGED, DEGRADED, FAILURE
"""

import logging
import math
import random
from datetime import datetime
from typing import Dict, Any, Optional
from asyncua import ua, uamethod

from .physics import PumpPhysics, create_physics_from_specs
from .modes import ModeParameters, SimulationMode, FailureType, get_diurnal_multiplier

_logger = logging.getLogger('simulation.pump')


class PumpSimulation:
    """Simulates a centrifugal pump with full instrumentation."""

    # Variable names for node binding
    ANALOG_VARIABLES = [
        'FlowRate', 'SuctionPressure', 'DischargePressure',
        'RPM', 'MotorCurrent', 'Voltage', 'PowerConsumption', 'PowerFactor', 'VFDFrequency',
        'MotorWindingTemp', 'BearingTemp_DE', 'BearingTemp_NDE', 'SealChamberTemp', 'AmbientTemp',
        'Vibration_DE_H', 'Vibration_DE_V', 'Vibration_DE_A',
        'Vibration_NDE_H', 'Vibration_NDE_V', 'Vibration_NDE_A',
        'RuntimeHours', 'StartCount', 'WetWellLevel'
    ]

    DISCRETE_VARIABLES = [
        'RunCommand', 'RunFeedback', 'FaultStatus', 'ReadyStatus', 'LocalRemote'
    ]

    def __init__(self, asset_id: str, name: str, node: Any, design_specs: Dict[str, Any],
                 server: Any, mode_params: ModeParameters):
        self.asset_id = asset_id
        self.name = name
        self.node = node
        self.server = server
        self.mode_params = mode_params

        # Physics engine
        self.physics = create_physics_from_specs(design_specs)
        self.design_specs = design_specs

        # Node references (populated during bind)
        self.nodes: Dict[str, Any] = {}
        self.eu_ranges: Dict[str, tuple] = {}

        # State variables
        self.is_running = False
        self.is_faulted = False
        self.is_local_mode = False
        self.target_rpm = 0.0
        self.current_rpm = 0.0
        self.runtime_hours = 0.0
        self.start_count = 0
        self.ambient_temp = 25.0
        self.wet_well_level = 4.0  # meters

        # Inertia parameters
        self.rpm_ramp_rate = 150.0  # RPM per second
        self.last_tick_time: Optional[datetime] = None

        # Diurnal flow target
        self.target_flow_ratio = 1.0

    async def bind(self) -> None:
        """Bind to OPC-UA nodes for reading/writing values."""
        await self._recursive_bind(self.node)

        # Read design specs from nodes
        await self._read_design_specs()

        # Read EURange for clamping
        await self._read_eu_ranges()

        # Bind methods
        await self._bind_methods()

        _logger.info(f"Bound pump simulation: {self.name} with {len(self.nodes)} nodes")
        # Log all top-level node keys (no dots)
        top_level = [k for k in self.nodes.keys() if '.' not in k]
        _logger.info(f"Pump {self.name} top-level nodes: {top_level}")

    async def _recursive_bind(self, node: Any, prefix: str = "") -> None:
        """Recursively bind all child nodes."""
        children = await node.get_children()
        for child in children:
            bn = await child.read_browse_name()
            key = f"{prefix}.{bn.Name}" if prefix else bn.Name
            self.nodes[key] = child

            node_class = await child.read_node_class()
            if node_class in [ua.NodeClass.Object, ua.NodeClass.Variable]:
                await self._recursive_bind(child, key)

    async def _read_design_specs(self) -> None:
        """Read design specs from DesignSpecs object."""
        spec_map = {
            'DesignSpecs.MaxRPM': 'MaxRPM',
            'DesignSpecs.MinRPM': 'MinRPM',
            'DesignSpecs.DesignFlow': 'DesignFlow',
            'DesignSpecs.DesignHead': 'DesignHead',
            'DesignSpecs.DesignPower': 'DesignPower',
            'DesignSpecs.FullLoadAmps': 'FullLoadAmps',
            'DesignSpecs.RatedVoltage': 'RatedVoltage',
            'DesignSpecs.ManufacturerBEP_Efficiency': 'ManufacturerBEP_Efficiency',
            'DesignSpecs.MotorEfficiency': 'MotorEfficiency',
        }

        for node_key, spec_key in spec_map.items():
            if node_key in self.nodes:
                try:
                    val = await self.nodes[node_key].get_value()
                    if val is not None:
                        self.design_specs[spec_key] = float(val)
                except Exception:
                    pass

        # Recreate physics with updated specs
        self.physics = create_physics_from_specs(self.design_specs)

    async def _read_eu_ranges(self) -> None:
        """Read EURange properties for value clamping."""
        for var_name in self.ANALOG_VARIABLES:
            if var_name in self.nodes:
                try:
                    children = await self.nodes[var_name].get_children()
                    for child in children:
                        bn = await child.read_browse_name()
                        if bn.Name == 'EURange':
                            val = await child.get_value()
                            if val:
                                self.eu_ranges[var_name] = (val.Low, val.High)
                            break
                except Exception:
                    pass

    async def _bind_methods(self) -> None:
        """Bind method implementations."""
        # Create wrapper functions that properly bind to self
        @uamethod
        def start_pump_wrapper(parent):
            return self._do_start_pump()

        @uamethod
        def stop_pump_wrapper(parent):
            return self._do_stop_pump()

        @uamethod
        def set_speed_wrapper(parent, target_rpm: float):
            return self._do_set_speed(target_rpm)

        @uamethod
        def reset_fault_wrapper(parent):
            return self._do_reset_fault()

        method_map = {
            'StartPump': start_pump_wrapper,
            'StopPump': stop_pump_wrapper,
            'SetSpeed': set_speed_wrapper,
            'ResetFault': reset_fault_wrapper,
        }

        _logger.debug(f"Available nodes for {self.name}: {list(self.nodes.keys())}")

        for method_name, callback in method_map.items():
            if method_name in self.nodes:
                try:
                    self.server.link_method(self.nodes[method_name], callback)
                    _logger.info(f"Bound method {method_name} for pump {self.name}")
                except Exception as e:
                    _logger.warning(f"Could not bind method {method_name}: {e}")
            else:
                _logger.warning(f"Method {method_name} not found in nodes for pump {self.name}")

    # =========================================================================
    # METHOD IMPLEMENTATIONS (called by OPC-UA method wrappers)
    # =========================================================================

    def _do_start_pump(self):
        """Start pump method handler."""
        if self.is_faulted:
            return [False, "Cannot start: pump is faulted"]
        if self.is_local_mode:
            return [False, "Cannot start: pump is in local mode"]

        self.is_running = True
        self.target_rpm = self.design_specs.get('MaxRPM', 1180) * 0.95
        self.start_count += 1
        _logger.info(f"Pump {self.name} started, target RPM: {self.target_rpm}")
        return [True, "Pump started successfully"]

    def _do_stop_pump(self):
        """Stop pump method handler."""
        self.is_running = False
        self.target_rpm = 0.0
        _logger.info(f"Pump {self.name} stopped")
        return [True, "Pump stopped successfully"]

    def _do_set_speed(self, target_rpm: float):
        """Set pump speed method handler."""
        min_rpm = self.design_specs.get('MinRPM', 600)
        max_rpm = self.design_specs.get('MaxRPM', 1180)

        if target_rpm < min_rpm or target_rpm > max_rpm:
            return [False, f"Speed must be between {min_rpm} and {max_rpm} RPM"]

        if not self.is_running:
            return [False, "Pump must be running to set speed"]

        self.target_rpm = target_rpm
        _logger.info(f"Pump {self.name} speed set to {target_rpm} RPM")
        return [True, f"Speed set to {target_rpm} RPM"]

    def _do_reset_fault(self):
        """Reset fault method handler."""
        self.is_faulted = False
        _logger.info(f"Pump {self.name} fault reset")
        return [True, "Fault reset"]

    # =========================================================================
    # SIMULATION TICK
    # =========================================================================

    async def tick(self, dt: float) -> None:
        """Update all sensor values for one simulation tick.

        Args:
            dt: Time delta in seconds since last tick
        """
        # Update diurnal flow target
        current_hour = datetime.now().hour
        self.target_flow_ratio = get_diurnal_multiplier(current_hour)

        # Update RPM with inertia
        self._update_rpm(dt)

        # Update runtime counter
        if self.is_running:
            # Apply time acceleration
            self.runtime_hours += (dt / 3600.0) * self.mode_params.time_acceleration

        # Calculate physics
        values = self._calculate_values()

        # Write values to OPC-UA nodes
        try:
            await self._write_values(values)
        except Exception as e:
            _logger.error(f"Pump {self.name} tick write error: {e}", exc_info=True)

    def _update_rpm(self, dt: float) -> None:
        """Update RPM with acceleration/deceleration inertia."""
        if self.target_rpm > self.current_rpm:
            self.current_rpm = min(
                self.target_rpm,
                self.current_rpm + self.rpm_ramp_rate * dt
            )
        elif self.target_rpm < self.current_rpm:
            self.current_rpm = max(
                self.target_rpm,
                self.current_rpm - self.rpm_ramp_rate * dt
            )

    def _calculate_values(self) -> Dict[str, Any]:
        """Calculate all sensor values based on current state."""
        # Mode factors
        efficiency_factor = self.mode_params.get_efficiency_factor()
        vibration_factor = self.mode_params.get_vibration_factor()
        temp_offset = self.mode_params.get_temperature_offset()
        flow_reduction = self.mode_params.get_flow_reduction_factor()

        # Physics calculations
        max_rpm = self.design_specs.get('MaxRPM', 1180)
        rated_voltage = self.design_specs.get('RatedVoltage', 480)
        fla = self.design_specs.get('FullLoadAmps', 225)
        design_flow = self.design_specs.get('DesignFlow', 2500)

        # Flow rate (affected by speed and wear)
        base_flow = self.physics.flow_at_speed(self.current_rpm)
        flow = base_flow * flow_reduction * self.target_flow_ratio

        # Head and pressure
        head = self.physics.head_at_flow(flow, self.current_rpm)
        suction_pressure = self.physics.calculate_suction_pressure(
            static_head=self.wet_well_level,
            flow=flow,
            design_flow=design_flow
        )
        discharge_pressure = self.physics.calculate_discharge_pressure(suction_pressure, head)

        # Efficiency (affected by mode)
        pump_efficiency = self.physics.estimate_efficiency(flow, self.current_rpm) * efficiency_factor
        motor_efficiency = self.design_specs.get('MotorEfficiency', 95.0)

        # Power consumption
        power = self.physics.calculate_electrical_power(
            flow, head, pump_efficiency, motor_efficiency
        )
        # Add minimum VFD losses when running
        if self.is_running and power < 5.0:
            power = 5.0

        # Electrical values
        load_fraction = power / self.design_specs.get('DesignPower', 150) if self.is_running else 0
        power_factor = self.physics.estimate_power_factor(load_fraction)
        voltage = rated_voltage * (0.98 + random.uniform(-0.02, 0.02))  # ±2%
        current = self.physics.calculate_motor_current(power, voltage, power_factor)
        frequency = self.physics.calculate_vfd_frequency(self.current_rpm)

        # Temperatures
        motor_winding_temp = self.physics.calculate_motor_winding_temp(
            self.ambient_temp + temp_offset, current, fla
        )

        # Vibration (calculate first for temperature effect)
        flow_deviation = (flow - design_flow * 0.8) / design_flow if design_flow > 0 else 0
        base_vibration = self.physics.calculate_vibration(
            self.current_rpm,
            imbalance_factor=vibration_factor,
            bearing_condition=vibration_factor,
            flow_deviation=flow_deviation
        )

        # Bearing temperatures
        bearing_temp_de = self.physics.calculate_bearing_temp(
            self.ambient_temp + temp_offset,
            power,
            base_vibration,
            wear_factor=(vibration_factor - 1.0)
        )
        bearing_temp_nde = bearing_temp_de - random.uniform(2, 5)  # NDE slightly cooler

        # Seal temperature
        seal_temp = self.physics.calculate_seal_temp(
            self.ambient_temp + temp_offset,
            flow,
            design_flow,
            wear_factor=(self.mode_params.degraded_config.seal_wear / 100.0
                         if self.mode_params.mode == SimulationMode.DEGRADED else 0)
        )

        # Vibration vectors (6-axis)
        def vibration_with_axis_variation(base: float, axis: str) -> float:
            """Add axis-specific variation to vibration."""
            factors = {'H': 1.0, 'V': 0.9, 'A': 0.7}
            return base * factors.get(axis, 1.0) * (1.0 + random.uniform(-0.1, 0.1))

        # Build values dictionary
        values = {
            # Flow
            'FlowRate': flow,

            # Pressure
            'SuctionPressure': suction_pressure,
            'DischargePressure': discharge_pressure,

            # VFD/Electrical
            'RPM': self.current_rpm,
            'MotorCurrent': current,
            'Voltage': voltage,
            'PowerConsumption': power,
            'PowerFactor': power_factor,
            'VFDFrequency': frequency,

            # Temperature
            'MotorWindingTemp': motor_winding_temp,
            'BearingTemp_DE': bearing_temp_de,
            'BearingTemp_NDE': bearing_temp_nde,
            'SealChamberTemp': seal_temp,
            'AmbientTemp': self.ambient_temp + random.uniform(-0.5, 0.5),

            # Vibration
            'Vibration_DE_H': vibration_with_axis_variation(base_vibration, 'H'),
            'Vibration_DE_V': vibration_with_axis_variation(base_vibration, 'V'),
            'Vibration_DE_A': vibration_with_axis_variation(base_vibration, 'A'),
            'Vibration_NDE_H': vibration_with_axis_variation(base_vibration * 0.85, 'H'),
            'Vibration_NDE_V': vibration_with_axis_variation(base_vibration * 0.85, 'V'),
            'Vibration_NDE_A': vibration_with_axis_variation(base_vibration * 0.85, 'A'),

            # Counters
            'RuntimeHours': self.runtime_hours,
            'StartCount': self.start_count,

            # Discrete
            'RunCommand': self.is_running,
            'RunFeedback': self.is_running and self.current_rpm > 100,
            'FaultStatus': self.is_faulted,
            'ReadyStatus': not self.is_faulted and not self.is_local_mode,
            'LocalRemote': not self.is_local_mode,

            # Wet well (for InfluentPumpType)
            'WetWellLevel': self.wet_well_level + math.sin(self.runtime_hours * 0.1) * 0.5,
        }

        return values

    async def _write_values(self, values: Dict[str, Any]) -> None:
        """Write calculated values to OPC-UA nodes with current timestamp."""
        now = datetime.utcnow()

        written_count = 0
        missing_nodes = []
        for var_name, value in values.items():
            if var_name not in self.nodes:
                missing_nodes.append(var_name)
                continue
            written_count += 1

            try:
                # Clamp to EURange if defined
                if var_name in self.eu_ranges:
                    low, high = self.eu_ranges[var_name]
                    if isinstance(value, (int, float)):
                        value = max(low, min(high, value))

                # Determine variant type and create DataValue with timestamp
                if isinstance(value, bool):
                    variant = ua.Variant(value, ua.VariantType.Boolean)
                elif isinstance(value, int):
                    variant = ua.Variant(value, ua.VariantType.UInt32)
                else:
                    variant = ua.Variant(float(value), ua.VariantType.Double)

                # Create DataValue with current source timestamp
                data_value = ua.DataValue(
                    Value=variant,
                    StatusCode_=ua.StatusCode(ua.StatusCodes.Good),
                    SourceTimestamp=now,
                    ServerTimestamp=now
                )

                # Write using write_attribute for full DataValue support
                await self.nodes[var_name].write_attribute(
                    ua.AttributeIds.Value,
                    data_value
                )

            except Exception as e:
                _logger.debug(f"Could not write {var_name}: {e}")

        if written_count == 0:
            _logger.warning(f"Pump {self.name}: No values written! Available nodes: {list(self.nodes.keys())[:10]}")
        elif missing_nodes:
            _logger.debug(f"Pump {self.name}: Missing nodes for: {missing_nodes[:5]}... (wrote {written_count})")

        # Log successful write occasionally (every ~10 seconds assuming 1s tick)
        if hasattr(self, '_write_log_counter'):
            self._write_log_counter += 1
        else:
            self._write_log_counter = 0

        if self._write_log_counter % 10 == 0:
            _logger.info(f"Pump {self.name}: Wrote {written_count} values (FlowRate={values.get('FlowRate', 0):.1f}, RPM={values.get('RPM', 0):.0f})")

    # =========================================================================
    # CONTROL METHODS
    # =========================================================================

    async def start(self) -> None:
        """Start the pump."""
        if not self.is_faulted:
            self.is_running = True
            self.target_rpm = self.design_specs.get('MaxRPM', 1180) * 0.95
            self.start_count += 1
            # Immediately write status to OPC-UA nodes
            await self._write_status_values()

    async def stop(self) -> None:
        """Stop the pump."""
        self.is_running = False
        self.target_rpm = 0.0
        # Immediately write status to OPC-UA nodes
        await self._write_status_values()

    async def _write_status_values(self) -> None:
        """Write discrete status values to OPC-UA nodes immediately."""
        from datetime import datetime
        now = datetime.utcnow()

        status_values = {
            'RunCommand': self.is_running,
            'RunFeedback': self.is_running and self.current_rpm > 100,
            'FaultStatus': self.is_faulted,
            'ReadyStatus': not self.is_faulted and not self.is_local_mode,
            'LocalRemote': not self.is_local_mode,
        }

        for var_name, value in status_values.items():
            if var_name not in self.nodes:
                continue
            try:
                variant = ua.Variant(value, ua.VariantType.Boolean)
                data_value = ua.DataValue(
                    Value=variant,
                    SourceTimestamp=now,
                    ServerTimestamp=now,
                    StatusCode=ua.StatusCode(ua.StatusCodes.Good)
                )
                await self.nodes[var_name].write_attribute(
                    ua.AttributeIds.Value,
                    data_value
                )
            except Exception as e:
                _logger.debug(f"Could not write status {var_name}: {e}")

    def set_speed(self, rpm: float) -> bool:
        """Set target speed."""
        min_rpm = self.design_specs.get('MinRPM', 600)
        max_rpm = self.design_specs.get('MaxRPM', 1180)

        if min_rpm <= rpm <= max_rpm:
            self.target_rpm = rpm
            return True
        return False

    def trigger_fault(self) -> None:
        """Trigger a fault condition."""
        self.is_faulted = True
        self.is_running = False
        self.target_rpm = 0.0

    def reset_fault(self) -> None:
        """Reset fault condition."""
        self.is_faulted = False

    def set_wet_well_level(self, level: float) -> None:
        """Set wet well level (for InfluentPumpType)."""
        self.wet_well_level = max(0.0, min(10.0, level))

    def get_state(self) -> Dict[str, Any]:
        """Get current pump state for WebSocket broadcasting."""
        # Calculate current values (same as _calculate_values but returns state dict)
        values = self._calculate_values()

        return {
            "id": self.asset_id,
            "name": self.name,
            "is_running": self.is_running,
            "is_faulted": self.is_faulted,
            "flow_rate": values.get('FlowRate', 0),
            "suction_pressure": values.get('SuctionPressure', 0),
            "discharge_pressure": values.get('DischargePressure', 0),
            "rpm": values.get('RPM', 0),
            "motor_current": values.get('MotorCurrent', 0),
            "voltage": values.get('Voltage', 0),
            "power_consumption": values.get('PowerConsumption', 0),
            "power_factor": values.get('PowerFactor', 0),
            "vfd_frequency": values.get('VFDFrequency', 0),
            "motor_winding_temp": values.get('MotorWindingTemp', 0),
            "bearing_temp_de": values.get('BearingTemp_DE', 0),
            "bearing_temp_nde": values.get('BearingTemp_NDE', 0),
            "seal_chamber_temp": values.get('SealChamberTemp', 0),
            "ambient_temp": values.get('AmbientTemp', 25),
            "vibration_de_h": values.get('Vibration_DE_H', 0),
            "vibration_de_v": values.get('Vibration_DE_V', 0),
            "vibration_de_a": values.get('Vibration_DE_A', 0),
            "vibration_nde_h": values.get('Vibration_NDE_H', 0),
            "vibration_nde_v": values.get('Vibration_NDE_V', 0),
            "vibration_nde_a": values.get('Vibration_NDE_A', 0),
            "runtime_hours": values.get('RuntimeHours', 0),
            "start_count": values.get('StartCount', 0),
            "wet_well_level": values.get('WetWellLevel', self.wet_well_level),
        }
