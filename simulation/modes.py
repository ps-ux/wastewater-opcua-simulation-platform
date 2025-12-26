"""Simulation modes for pump degradation and failure modeling.

Supports 4 modes per SPECS.md:
- OPTIMAL: New pump at manufacturer specifications
- AGED: 5-year simulated wear
- DEGRADED: Configurable wear parameters
- FAILURE: Progressive failure simulation
"""

from enum import IntEnum
from dataclasses import dataclass, field
from typing import Optional


class SimulationMode(IntEnum):
    """Pump simulation operating modes."""
    OPTIMAL = 0    # New pump, manufacturer specs
    AGED = 1       # 5-year wear
    DEGRADED = 2   # Configurable wear
    FAILURE = 3    # Progressive failure


class FailureType(IntEnum):
    """Types of pump failures that can be simulated."""
    NONE = 0
    BEARING = 1      # Bearing failure
    SEAL = 2         # Mechanical seal failure
    CAVITATION = 3   # Cavitation damage
    IMPELLER = 4     # Impeller damage/wear
    MOTOR = 5        # Motor winding failure


@dataclass
class AgedConfig:
    """Configuration for AGED simulation mode."""
    years_of_operation: float = 5.0
    average_run_hours_per_year: float = 6000.0
    start_cycles_per_year: int = 500

    @property
    def total_runtime_hours(self) -> float:
        return self.years_of_operation * self.average_run_hours_per_year

    @property
    def total_start_cycles(self) -> int:
        return int(self.years_of_operation * self.start_cycles_per_year)


@dataclass
class DegradedConfig:
    """Configuration for DEGRADED simulation mode."""
    impeller_wear: float = 15.0    # % clearance increase (0-50)
    bearing_wear: float = 20.0     # % damage (0-100)
    seal_wear: float = 25.0        # % degradation (0-100)


@dataclass
class FailureConfig:
    """Configuration for FAILURE simulation mode."""
    failure_type: FailureType = FailureType.NONE
    failure_progression: float = 0.0  # % (0-100)
    time_to_failure: float = 100.0    # hours


@dataclass
class FlowProfileConfig:
    """Diurnal flow profile configuration."""
    diurnal_enabled: bool = True
    base_flow: float = 1600.0    # m³/h (minimum demand)
    peak_flow: float = 4000.0    # m³/h (maximum demand)
    peak_hour_1: int = 7         # Morning peak (0-23)
    peak_hour_2: int = 19        # Evening peak (0-23)


@dataclass
class ModeParameters:
    """Complete simulation mode parameters."""
    mode: SimulationMode = SimulationMode.OPTIMAL
    aged_config: AgedConfig = field(default_factory=AgedConfig)
    degraded_config: DegradedConfig = field(default_factory=DegradedConfig)
    failure_config: FailureConfig = field(default_factory=FailureConfig)
    flow_profile: FlowProfileConfig = field(default_factory=FlowProfileConfig)
    simulation_interval: float = 1000.0  # ms
    time_acceleration: float = 1.0

    def get_efficiency_factor(self) -> float:
        """Get efficiency reduction factor based on mode and wear."""
        if self.mode == SimulationMode.OPTIMAL:
            return 1.0

        elif self.mode == SimulationMode.AGED:
            # 5 years = ~3% efficiency loss
            years = self.aged_config.years_of_operation
            return max(0.85, 1.0 - (years * 0.006))

        elif self.mode == SimulationMode.DEGRADED:
            # Impeller wear directly affects efficiency
            impeller_factor = 1.0 - (self.degraded_config.impeller_wear / 100.0)
            return max(0.6, impeller_factor)

        elif self.mode == SimulationMode.FAILURE:
            # Progressive efficiency loss
            progression = self.failure_config.failure_progression / 100.0
            return max(0.3, 1.0 - (progression * 0.7))

        return 1.0

    def get_vibration_factor(self) -> float:
        """Get vibration increase factor based on mode and wear."""
        if self.mode == SimulationMode.OPTIMAL:
            return 1.0

        elif self.mode == SimulationMode.AGED:
            years = self.aged_config.years_of_operation
            return 1.0 + (years * 0.1)  # 10% increase per year

        elif self.mode == SimulationMode.DEGRADED:
            bearing_factor = 1.0 + (self.degraded_config.bearing_wear / 50.0)
            return bearing_factor

        elif self.mode == SimulationMode.FAILURE:
            if self.failure_config.failure_type == FailureType.BEARING:
                progression = self.failure_config.failure_progression / 100.0
                return 1.0 + (progression * 5.0)  # Up to 6x vibration
            elif self.failure_config.failure_type == FailureType.IMPELLER:
                progression = self.failure_config.failure_progression / 100.0
                return 1.0 + (progression * 3.0)  # Up to 4x vibration
            else:
                return 1.0 + (self.failure_config.failure_progression / 100.0)

        return 1.0

    def get_temperature_offset(self) -> float:
        """Get temperature increase offset based on mode."""
        if self.mode == SimulationMode.OPTIMAL:
            return 0.0

        elif self.mode == SimulationMode.AGED:
            return 5.0  # 5°C higher due to wear

        elif self.mode == SimulationMode.DEGRADED:
            # Bearing wear causes higher temps
            return self.degraded_config.bearing_wear * 0.3

        elif self.mode == SimulationMode.FAILURE:
            if self.failure_config.failure_type == FailureType.BEARING:
                return self.failure_config.failure_progression * 0.5
            elif self.failure_config.failure_type == FailureType.MOTOR:
                return self.failure_config.failure_progression * 0.8
            else:
                return self.failure_config.failure_progression * 0.2

        return 0.0

    def get_flow_reduction_factor(self) -> float:
        """Get flow reduction factor due to wear."""
        if self.mode == SimulationMode.OPTIMAL:
            return 1.0

        elif self.mode == SimulationMode.AGED:
            # Slight flow reduction due to impeller wear
            return 0.97

        elif self.mode == SimulationMode.DEGRADED:
            # Impeller wear reduces flow capacity
            return 1.0 - (self.degraded_config.impeller_wear / 200.0)

        elif self.mode == SimulationMode.FAILURE:
            if self.failure_config.failure_type == FailureType.IMPELLER:
                return 1.0 - (self.failure_config.failure_progression / 150.0)
            elif self.failure_config.failure_type == FailureType.CAVITATION:
                return 1.0 - (self.failure_config.failure_progression / 200.0)
            else:
                return 1.0

        return 1.0


# Diurnal flow multipliers by hour (0-23)
HOURLY_FLOW_MULTIPLIERS = {
    0: 0.60, 1: 0.55, 2: 0.50, 3: 0.50, 4: 0.55, 5: 0.70,
    6: 1.00, 7: 1.30, 8: 1.40, 9: 1.20, 10: 1.00, 11: 0.95,
    12: 1.10, 13: 1.15, 14: 1.00, 15: 0.90, 16: 0.95, 17: 1.00,
    18: 1.20, 19: 1.30, 20: 1.20, 21: 1.00, 22: 0.85, 23: 0.70
}


def get_diurnal_multiplier(hour: int) -> float:
    """Get flow multiplier for given hour of day."""
    return HOURLY_FLOW_MULTIPLIERS.get(hour % 24, 1.0)
