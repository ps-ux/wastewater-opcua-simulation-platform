"""Pump physics models based on affinity laws.

Implements realistic pump behavior for simulation including:
- Affinity laws for VFD speed control
- Head-flow relationships
- Power consumption models
- Vibration models
- Temperature models

Reference: SPECS.md Section 6 - Physics Models
"""

import math
import random
from dataclasses import dataclass
from typing import Optional


@dataclass
class DesignPoint:
    """Pump design point (BEP) specifications."""
    flow: float = 2500.0        # m³/h at BEP
    head: float = 15.0          # meters TDH at BEP
    power: float = 150.0        # kW motor rated power
    efficiency: float = 84.0    # % pump efficiency at BEP
    motor_efficiency: float = 95.4  # % motor efficiency
    max_rpm: int = 1180         # Maximum motor speed
    min_rpm: int = 600          # Minimum continuous speed
    impeller_diameter: float = 450.0  # mm
    npsh_required: float = 4.5  # meters


class PumpPhysics:
    """Physics calculations for centrifugal pump simulation."""

    # Physical constants
    WATER_DENSITY = 998.0  # kg/m³
    GRAVITY = 9.81  # m/s²

    def __init__(self, design: DesignPoint):
        self.design = design
        # Calculate shutoff head (typically 1.2x design head)
        self.shutoff_head = design.head * 1.2
        # Head curve coefficient
        self.k = (self.shutoff_head - design.head) / (design.flow ** 2)

    # =========================================================================
    # AFFINITY LAWS
    # =========================================================================

    def flow_at_speed(self, current_rpm: float) -> float:
        """Calculate flow rate at given speed using affinity law.

        Q2/Q1 = N2/N1
        Flow is directly proportional to speed.
        """
        if self.design.max_rpm == 0:
            return 0.0
        ratio = current_rpm / self.design.max_rpm
        return self.design.flow * ratio

    def head_at_speed(self, current_rpm: float) -> float:
        """Calculate head at given speed using affinity law.

        H2/H1 = (N2/N1)²
        Head varies with square of speed.
        """
        if self.design.max_rpm == 0:
            return 0.0
        ratio = current_rpm / self.design.max_rpm
        return self.design.head * (ratio ** 2)

    def power_at_speed(self, current_rpm: float) -> float:
        """Calculate power at given speed using affinity law.

        P2/P1 = (N2/N1)³
        Power varies with cube of speed.
        """
        if self.design.max_rpm == 0:
            return 0.0
        ratio = current_rpm / self.design.max_rpm
        return self.design.power * (ratio ** 3)

    # =========================================================================
    # HEAD-FLOW RELATIONSHIP
    # =========================================================================

    def head_at_flow(self, flow: float, current_rpm: float) -> float:
        """Calculate head at given flow rate on pump curve.

        H = H_shutoff * (N/N_max)² - k * Q²

        This models the typical pump curve where head decreases
        as flow increases.
        """
        if self.design.max_rpm == 0:
            return 0.0

        speed_ratio = current_rpm / self.design.max_rpm
        scaled_shutoff = self.shutoff_head * (speed_ratio ** 2)

        # Scale k coefficient with speed
        scaled_k = self.k * (speed_ratio ** 2)

        head = scaled_shutoff - scaled_k * (flow ** 2)
        return max(0.0, head)

    # =========================================================================
    # POWER MODEL
    # =========================================================================

    def calculate_hydraulic_power(self, flow: float, head: float) -> float:
        """Calculate hydraulic power (water horsepower).

        P_hydraulic = ρ * g * Q * H / 1000

        Where:
        - ρ = water density (kg/m³)
        - g = gravity (m/s²)
        - Q = flow (m³/s)
        - H = head (m)

        Returns power in kW.
        """
        flow_m3s = flow / 3600.0  # Convert m³/h to m³/s
        power = self.WATER_DENSITY * self.GRAVITY * flow_m3s * head / 1000.0
        return power

    def calculate_shaft_power(self, flow: float, head: float,
                               pump_efficiency: float) -> float:
        """Calculate shaft power (brake horsepower).

        P_shaft = P_hydraulic / η_pump
        """
        if pump_efficiency <= 0:
            return 0.0
        hydraulic_power = self.calculate_hydraulic_power(flow, head)
        return hydraulic_power / (pump_efficiency / 100.0)

    def calculate_electrical_power(self, flow: float, head: float,
                                     pump_efficiency: float,
                                     motor_efficiency: float) -> float:
        """Calculate electrical power consumption.

        P_electrical = P_shaft / η_motor
        """
        if motor_efficiency <= 0:
            return 0.0
        shaft_power = self.calculate_shaft_power(flow, head, pump_efficiency)
        return shaft_power / (motor_efficiency / 100.0)

    def estimate_efficiency(self, flow: float, current_rpm: float) -> float:
        """Estimate pump efficiency at operating point.

        Efficiency curve peaks at BEP and drops off at lower/higher flows.
        Model: η = η_max * (1 - ((Q - Q_bep) / Q_bep)² * 0.5)
        """
        if self.design.max_rpm == 0:
            return 0.0

        speed_ratio = current_rpm / self.design.max_rpm
        bep_flow = self.design.flow * speed_ratio

        if bep_flow == 0:
            return 0.0

        flow_deviation = (flow - bep_flow) / bep_flow
        efficiency = self.design.efficiency * (1.0 - (flow_deviation ** 2) * 0.5)

        return max(20.0, min(self.design.efficiency, efficiency))

    # =========================================================================
    # ELECTRICAL CALCULATIONS
    # =========================================================================

    def calculate_motor_current(self, power_kw: float, voltage: float,
                                 power_factor: float = 0.85) -> float:
        """Calculate motor current from power.

        I = P / (√3 * V * PF)  for 3-phase motor
        """
        if voltage == 0 or power_factor == 0:
            return 0.0
        current = (power_kw * 1000) / (math.sqrt(3) * voltage * power_factor)
        return current

    def estimate_power_factor(self, load_fraction: float) -> float:
        """Estimate power factor based on motor load.

        Power factor improves with load, peaks around 75-100% load.
        """
        if load_fraction < 0.25:
            return 0.65 + load_fraction * 0.4
        elif load_fraction < 1.0:
            return 0.75 + load_fraction * 0.15
        else:
            return 0.90

    def calculate_vfd_frequency(self, current_rpm: float) -> float:
        """Calculate VFD output frequency from RPM.

        For 4-pole motor: f = (RPM * poles) / 120
        """
        poles = 6  # 6-pole for 1180 RPM synchronous
        if self.design.max_rpm > 1500:
            poles = 4  # 4-pole for 1750 RPM
        elif self.design.max_rpm > 1000:
            poles = 6  # 6-pole for 1180 RPM

        frequency = (current_rpm * poles) / 120.0
        return min(65.0, max(0.0, frequency))

    # =========================================================================
    # VIBRATION MODEL
    # =========================================================================

    def calculate_vibration(self, rpm: float, imbalance_factor: float = 1.0,
                            bearing_condition: float = 1.0,
                            flow_deviation: float = 0.0) -> float:
        """Calculate vibration velocity (mm/s RMS).

        Components:
        - Base vibration proportional to speed
        - Imbalance contribution (1x RPM)
        - Bearing contribution (high frequency)
        - Flow-induced (off-BEP operation)

        Returns vibration in mm/s.
        """
        if rpm == 0:
            return 0.1  # Baseline noise

        speed_ratio = rpm / self.design.max_rpm

        # Base vibration (well-maintained pump at BEP)
        base_vibration = 2.0 * speed_ratio

        # Imbalance contribution
        imbalance = 0.5 * imbalance_factor * speed_ratio

        # Bearing wear contribution
        bearing = 0.3 * (bearing_condition - 1.0) * speed_ratio

        # Flow deviation (off-BEP causes hydraulic vibration)
        flow_vib = abs(flow_deviation) * 1.5

        # Random component (±10%)
        noise = random.uniform(-0.1, 0.1) * base_vibration

        total = base_vibration + imbalance + bearing + flow_vib + noise
        return max(0.3, min(30.0, total))

    # =========================================================================
    # TEMPERATURE MODEL
    # =========================================================================

    def calculate_bearing_temp(self, ambient: float, power_kw: float,
                                vibration: float, wear_factor: float = 0.0) -> float:
        """Calculate bearing temperature.

        Temperature depends on:
        - Ambient temperature
        - Power (heat generation)
        - Vibration (friction heat)
        - Bearing wear

        Returns temperature in °C.
        """
        # Heat rise from power (bearing friction is ~2% of power)
        power_rise = power_kw * 0.15

        # Heat from vibration (higher vibration = more friction)
        vibration_rise = vibration * 2.0

        # Wear increases friction
        wear_rise = wear_factor * 15.0

        # Random variation
        noise = random.uniform(-1.0, 1.0)

        temp = ambient + power_rise + vibration_rise + wear_rise + noise
        return max(ambient, min(150.0, temp))

    def calculate_motor_winding_temp(self, ambient: float, current: float,
                                      full_load_amps: float) -> float:
        """Calculate motor winding temperature.

        Winding temp rises with I² (copper losses).
        """
        if full_load_amps == 0:
            return ambient

        load_fraction = current / full_load_amps
        # Class F insulation: max 155°C, typical rise 80°C at FLA
        temp_rise = 80.0 * (load_fraction ** 2)

        noise = random.uniform(-2.0, 2.0)
        temp = ambient + temp_rise + noise
        return max(ambient, min(180.0, temp))

    def calculate_seal_temp(self, ambient: float, flow: float,
                            design_flow: float, wear_factor: float = 0.0) -> float:
        """Calculate mechanical seal chamber temperature.

        Seal temp affected by:
        - Pumped fluid temperature (≈ambient for simulation)
        - Low flow increases seal chamber temp
        - Seal wear increases friction heat
        """
        base_temp = ambient + 5.0  # Slightly above ambient

        # Low flow penalty
        if design_flow > 0 and flow < design_flow * 0.5:
            flow_ratio = flow / (design_flow * 0.5)
            low_flow_rise = (1.0 - flow_ratio) * 20.0
        else:
            low_flow_rise = 0.0

        # Wear contribution
        wear_rise = wear_factor * 10.0

        noise = random.uniform(-1.0, 1.0)
        temp = base_temp + low_flow_rise + wear_rise + noise
        return max(ambient, min(120.0, temp))

    # =========================================================================
    # PRESSURE MODEL
    # =========================================================================

    def calculate_suction_pressure(self, static_head: float = 3.0,
                                    flow: float = 0.0,
                                    design_flow: float = 2500.0) -> float:
        """Calculate suction pressure in bar.

        Suction pressure = static head - velocity head - friction losses
        """
        # Static head in bar (1 bar ≈ 10.2 m water)
        static_p = static_head / 10.2

        # Friction loss increases with flow²
        if design_flow > 0:
            friction_loss = 0.1 * (flow / design_flow) ** 2
        else:
            friction_loss = 0.0

        # Add small random variation
        noise = random.uniform(-0.02, 0.02)

        pressure = static_p - friction_loss + noise
        return max(-0.5, min(2.0, pressure))

    def calculate_discharge_pressure(self, suction_pressure: float,
                                       head: float) -> float:
        """Calculate discharge pressure in bar.

        Discharge = Suction + Head (converted to bar)
        """
        head_bar = head / 10.2  # Convert meters to bar
        noise = random.uniform(-0.02, 0.02)
        return suction_pressure + head_bar + noise


def create_physics_from_specs(specs: dict) -> PumpPhysics:
    """Create PumpPhysics instance from design specs dictionary."""
    design = DesignPoint(
        flow=specs.get('DesignFlow', 2500.0),
        head=specs.get('DesignHead', 15.0),
        power=specs.get('DesignPower', 150.0),
        efficiency=specs.get('ManufacturerBEP_Efficiency', 84.0),
        motor_efficiency=specs.get('MotorEfficiency', 95.4),
        max_rpm=specs.get('MaxRPM', 1180),
        min_rpm=specs.get('MinRPM', 600),
        impeller_diameter=specs.get('ImpellerDiameter', 450.0),
        npsh_required=specs.get('NPSHRequired', 4.5)
    )
    return PumpPhysics(design)
