"""Chamber simulation class.

Simulates tanks, wet wells, channels, and clarifiers with:
- Level measurement
- Temperature measurement
- Simple fill/drain dynamics
"""

import logging
import math
import random
from datetime import datetime
from typing import Dict, Any, Optional
from asyncua import ua

from .modes import ModeParameters

_logger = logging.getLogger('simulation.chamber')


class ChamberSimulation:
    """Simulates a chamber (tank, wet well, channel) with level and temperature."""

    def __init__(self, asset_id: str, name: str, node: Any,
                 server: Any, mode_params: ModeParameters):
        self.asset_id = asset_id
        self.name = name
        self.node = node
        self.server = server
        self.mode_params = mode_params

        # Node references
        self.nodes: Dict[str, Any] = {}
        self.eu_ranges: Dict[str, tuple] = {}

        # State variables
        self.level = 4.0  # meters
        self.temperature = 20.0  # °C
        self.tick_count = 0

        # Simulation parameters
        self.level_min = 1.0
        self.level_max = 7.0
        self.level_setpoint = 4.0
        self.level_rate = 0.1  # m/s change rate
        self.temp_ambient = 18.0

    async def bind(self) -> None:
        """Bind to OPC-UA nodes."""
        await self._recursive_bind(self.node)
        await self._read_eu_ranges()

        _logger.info(f"Bound chamber simulation: {self.name} with {len(self.nodes)} nodes")

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

    async def _read_eu_ranges(self) -> None:
        """Read EURange properties for value clamping."""
        for var_name in ['Level', 'Temperature']:
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

    async def tick(self, dt: float) -> None:
        """Update chamber values for one simulation tick."""
        self.tick_count += 1

        # Simulate level with sinusoidal variation (simulating fill/drain cycles)
        # Period of about 10 minutes with random perturbation
        period = 600.0 + random.uniform(-60, 60)
        self.level = self.level_setpoint + 1.5 * math.sin(2 * math.pi * self.tick_count * dt / period)

        # Add some random noise
        self.level += random.uniform(-0.05, 0.05)

        # Clamp to range
        self.level = max(self.level_min, min(self.level_max, self.level))

        # Temperature with slow daily variation
        daily_period = 86400.0  # seconds
        self.temperature = self.temp_ambient + 3.0 * math.sin(2 * math.pi * self.tick_count * dt / daily_period)
        self.temperature += random.uniform(-0.2, 0.2)

        # Write values
        await self._write_values()

    async def _write_values(self) -> None:
        """Write values to OPC-UA nodes with current timestamp."""
        now = datetime.utcnow()

        values = {
            'Level': self.level,
            'Temperature': self.temperature
        }

        for var_name, value in values.items():
            if var_name not in self.nodes:
                continue

            try:
                # Clamp to EURange
                if var_name in self.eu_ranges:
                    low, high = self.eu_ranges[var_name]
                    value = max(low, min(high, value))

                # Create DataValue with current source timestamp
                variant = ua.Variant(float(value), ua.VariantType.Double)
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

    def set_level(self, level: float) -> None:
        """Set chamber level directly."""
        self.level = max(self.level_min, min(self.level_max, level))

    def set_level_setpoint(self, setpoint: float) -> None:
        """Set level control setpoint."""
        self.level_setpoint = max(self.level_min, min(self.level_max, setpoint))

    def get_level(self) -> float:
        """Get current level."""
        return self.level
