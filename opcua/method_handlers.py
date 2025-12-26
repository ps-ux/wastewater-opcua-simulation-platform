"""OPC-UA method handlers.

Binds Python callbacks to OPC-UA methods on SimulationConfig and pumps.
"""

import logging
from typing import Dict, Any, Optional
from asyncua import ua, uamethod

from simulation.engine import SimulationEngine
from simulation.modes import SimulationMode, FailureType

_logger = logging.getLogger('opcua.method_handlers')


class MethodHandlers:
    """Handles OPC-UA method bindings for simulation control."""

    def __init__(self, server: Any, engine: SimulationEngine, node_map: Dict[str, Any]):
        self.server = server
        self.engine = engine
        self.node_map = node_map

    async def bind_simulation_config_methods(self, sim_config_node: Any) -> None:
        """Bind methods on SimulationConfig object."""
        children = await sim_config_node.get_children()
        method_map = {}

        for child in children:
            bn = await child.read_browse_name()
            method_map[bn.Name] = child

        # Bind SetMode method
        if 'SetMode' in method_map:
            self.server.link_method(method_map['SetMode'], self._set_mode_handler)
            _logger.debug("Bound SetMode method")

        # Bind TriggerFailure method
        if 'TriggerFailure' in method_map:
            self.server.link_method(method_map['TriggerFailure'], self._trigger_failure_handler)
            _logger.debug("Bound TriggerFailure method")

        # Bind ResetSimulation method
        if 'ResetSimulation' in method_map:
            self.server.link_method(method_map['ResetSimulation'], self._reset_simulation_handler)
            _logger.debug("Bound ResetSimulation method")

        # Bind ApplyAging method
        if 'ApplyAging' in method_map:
            self.server.link_method(method_map['ApplyAging'], self._apply_aging_handler)
            _logger.debug("Bound ApplyAging method")

    @uamethod
    def _set_mode_handler(self, parent, new_mode: int):
        """Handle SetMode method call."""
        try:
            mode = SimulationMode(new_mode)
            self.engine.set_mode(mode)
            _logger.info(f"Simulation mode set to {mode.name}")
            return [True]
        except ValueError:
            _logger.warning(f"Invalid simulation mode: {new_mode}")
            return [False]

    @uamethod
    def _trigger_failure_handler(self, parent, failure_type: int):
        """Handle TriggerFailure method call."""
        try:
            ftype = FailureType(failure_type)

            # Trigger on first running pump, or first pump if none running
            for pump in self.engine.pumps.values():
                if pump.is_running:
                    self.engine.trigger_failure(pump.asset_id, ftype)
                    _logger.info(f"Triggered {ftype.name} failure on {pump.name}")
                    return [True]

            # No running pump, trigger on first pump
            if self.engine.pumps:
                first_pump = next(iter(self.engine.pumps.values()))
                self.engine.trigger_failure(first_pump.asset_id, ftype)
                _logger.info(f"Triggered {ftype.name} failure on {first_pump.name}")
                return [True]

            return [False]

        except ValueError:
            _logger.warning(f"Invalid failure type: {failure_type}")
            return [False]

    @uamethod
    def _reset_simulation_handler(self, parent):
        """Handle ResetSimulation method call."""
        self.engine.reset_simulation()
        _logger.info("Simulation reset to OPTIMAL")
        return [True]

    @uamethod
    def _apply_aging_handler(self, parent, years: float):
        """Handle ApplyAging method call."""
        if years < 0 or years > 50:
            _logger.warning(f"Invalid aging years: {years}")
            return [False]

        self.engine.apply_aging(years)
        _logger.info(f"Applied {years} years of aging")
        return [True]

    async def bind_pump_methods(self, pump_node: Any, pump_sim: Any) -> None:
        """Bind methods on a pump instance.

        Note: Pump simulation already binds its own methods during bind().
        This method is for additional bindings if needed.
        """
        pass  # Pump methods are bound in PumpSimulation.bind()

    async def update_simulation_config_values(self, sim_config_node: Any) -> None:
        """Update SimulationConfig node values from engine state."""
        try:
            children = await sim_config_node.get_children()
            node_map = {}

            for child in children:
                bn = await child.read_browse_name()
                node_map[bn.Name] = child

                # Get nested children for config objects
                if bn.Name in ['AgedConfig', 'DegradedConfig', 'FailureConfig', 'FlowProfile']:
                    sub_children = await child.get_children()
                    for sub in sub_children:
                        sub_bn = await sub.read_browse_name()
                        node_map[f"{bn.Name}.{sub_bn.Name}"] = sub

            # Update Mode property
            if 'Mode' in node_map:
                await node_map['Mode'].write_value(
                    int(self.engine.mode_params.mode),
                    ua.VariantType.Int32
                )

            # Update SimulationInterval
            if 'SimulationInterval' in node_map:
                await node_map['SimulationInterval'].write_value(
                    self.engine.interval_ms,
                    ua.VariantType.Double
                )

            # Update TimeAcceleration
            if 'TimeAcceleration' in node_map:
                await node_map['TimeAcceleration'].write_value(
                    self.engine.mode_params.time_acceleration,
                    ua.VariantType.Double
                )

        except Exception as e:
            _logger.warning(f"Error updating simulation config: {e}")

    async def setup_config_subscriptions(self, sim_config_node: Any) -> None:
        """Set up subscriptions for writable config values."""
        try:
            children = await sim_config_node.get_children()

            for child in children:
                bn = await child.read_browse_name()

                if bn.Name == 'SimulationInterval':
                    await child.set_writable()
                    # Create subscription for interval changes
                    handler = IntervalChangeHandler(self.engine)
                    sub = await self.server.create_subscription(500, handler)
                    await sub.subscribe_data_change(child)
                    _logger.debug("Set up subscription for SimulationInterval")

                elif bn.Name == 'TimeAcceleration':
                    await child.set_writable()
                    handler = TimeAccelerationHandler(self.engine)
                    sub = await self.server.create_subscription(500, handler)
                    await sub.subscribe_data_change(child)
                    _logger.debug("Set up subscription for TimeAcceleration")

                elif bn.Name == 'Mode':
                    await child.set_writable()
                    handler = ModeChangeHandler(self.engine)
                    sub = await self.server.create_subscription(500, handler)
                    await sub.subscribe_data_change(child)
                    _logger.debug("Set up subscription for Mode")

        except Exception as e:
            _logger.warning(f"Error setting up config subscriptions: {e}")


class IntervalChangeHandler:
    """Handles changes to SimulationInterval."""

    def __init__(self, engine: SimulationEngine):
        self.engine = engine

    def datachange_notification(self, node, val, data):
        self.engine.set_interval(float(val))


class TimeAccelerationHandler:
    """Handles changes to TimeAcceleration."""

    def __init__(self, engine: SimulationEngine):
        self.engine = engine

    def datachange_notification(self, node, val, data):
        self.engine.mode_params.time_acceleration = max(0.1, min(100.0, float(val)))
        _logger.info(f"Time acceleration set to {self.engine.mode_params.time_acceleration}")


class ModeChangeHandler:
    """Handles changes to Mode."""

    def __init__(self, engine: SimulationEngine):
        self.engine = engine

    def datachange_notification(self, node, val, data):
        try:
            mode = SimulationMode(int(val))
            self.engine.set_mode(mode)
        except ValueError:
            _logger.warning(f"Invalid mode value: {val}")
