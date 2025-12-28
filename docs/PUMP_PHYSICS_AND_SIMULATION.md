# OPC-UA Pump Simulation: Physics & Operating Modes

## Complete Technical Reference for Centrifugal Pump Simulation

This document provides a comprehensive analysis of the physics models, simulation modes, and real-time visualization implemented in the OPC-UA Wastewater Treatment Pump Simulation Platform.

---

## Table of Contents

1. [Design Point (BEP) Specifications](#1-design-point-bep-specifications)
2. [Affinity Laws Implementation](#2-affinity-laws-implementation)
3. [Pump Curve Physics (H-Q Relationship)](#3-pump-curve-physics-h-q-relationship)
4. [Power Consumption Models](#4-power-consumption-models)
5. [Efficiency Calculations](#5-efficiency-calculations)
6. [Electrical System Models](#6-electrical-system-models)
7. [Pressure Calculations](#7-pressure-calculations)
8. [Vibration Modeling](#8-vibration-modeling)
9. [Temperature Models](#9-temperature-models)
10. [Simulation Modes](#10-simulation-modes)
11. [3D Visualization Physics](#11-3d-visualization-physics)
12. [Pump Curve Generation for UI](#12-pump-curve-generation-for-ui)
13. [Diurnal Flow Profile](#13-diurnal-flow-profile)
14. [Simulating Real-World Scenarios](#14-simulating-real-world-scenarios)

---

## 1. Design Point (BEP) Specifications

The **Best Efficiency Point (BEP)** represents the operating condition where the pump achieves maximum hydraulic efficiency. The simulation uses the following design parameters:

| Parameter | Value | Unit | Description |
|-----------|-------|------|-------------|
| **Design Flow (Q_BEP)** | 2500 | m³/h | Flow rate at BEP |
| **Design Head (H_BEP)** | 15 | m | Total Dynamic Head at BEP |
| **Design Power** | 150 | kW | Motor rated power |
| **Pump Efficiency (η_pump)** | 84 | % | Hydraulic efficiency at BEP |
| **Motor Efficiency (η_motor)** | 95.4 | % | Motor electrical efficiency |
| **Maximum RPM** | 1180 | RPM | 6-pole synchronous speed |
| **Minimum RPM** | 600 | RPM | Minimum continuous operation |
| **Impeller Diameter** | 450 | mm | Wastewater clog-resistant design |
| **NPSH Required** | 4.5 | m | Net Positive Suction Head |
| **Shutoff Head** | 18 | m | Head at zero flow (1.2 × H_BEP) |

**Source:** `simulation/physics.py:19-30` - `DesignPoint` dataclass

---

## 2. Affinity Laws Implementation

The **Affinity Laws** (also called Pump Laws or Fan Laws) are fundamental relationships governing centrifugal pump behavior under VFD speed control.

### Law 1: Flow is Proportional to Speed (Linear)

```
Q₂ / Q₁ = N₂ / N₁

   or:  Q₂ = Q₁ × (N₂ / N₁)
```

**Implementation:**
```python
def flow_at_speed(self, current_rpm: float) -> float:
    ratio = current_rpm / self.design.max_rpm
    return self.design.flow * ratio
```

**Example:**
- At 50% speed (590 RPM): Flow = 2500 × 0.5 = **1250 m³/h**
- At 80% speed (944 RPM): Flow = 2500 × 0.8 = **2000 m³/h**

### Law 2: Head Varies with Square of Speed (Quadratic)

```
H₂ / H₁ = (N₂ / N₁)²

   or:  H₂ = H₁ × (N₂ / N₁)²
```

**Implementation:**
```python
def head_at_speed(self, current_rpm: float) -> float:
    ratio = current_rpm / self.design.max_rpm
    return self.design.head * (ratio ** 2)
```

**Example:**
- At 50% speed: Head = 15 × (0.5)² = **3.75 m**
- At 80% speed: Head = 15 × (0.8)² = **9.6 m**

### Law 3: Power Varies with Cube of Speed (Cubic)

```
P₂ / P₁ = (N₂ / N₁)³

   or:  P₂ = P₁ × (N₂ / N₁)³
```

**Implementation:**
```python
def power_at_speed(self, current_rpm: float) -> float:
    ratio = current_rpm / self.design.max_rpm
    return self.design.power * (ratio ** 3)
```

**Example:**
- At 50% speed: Power = 150 × (0.5)³ = **18.75 kW** (87.5% energy savings!)
- At 80% speed: Power = 150 × (0.8)³ = **76.8 kW** (48.8% energy savings)

> **Critical Insight:** The cubic relationship means small speed reductions yield dramatic energy savings. This is why VFD control is highly effective for energy management in wastewater facilities.

**Source:** `simulation/physics.py:47-82`

---

## 3. Pump Curve Physics (H-Q Relationship)

The pump curve describes the relationship between flow rate and head developed by the pump at a given speed.

### Parabolic Pump Curve Equation

```
H = H_shutoff × (N / N_max)² - k × Q²
```

Where:
- **H** = Head at operating point (m)
- **H_shutoff** = Shutoff head at zero flow = 1.2 × Design Head = 18 m
- **N** = Current RPM
- **N_max** = Maximum RPM (1180)
- **k** = Head curve coefficient
- **Q** = Flow rate (m³/h)

### Curve Coefficient Calculation

```
k = (H_shutoff - H_design) / Q_design²

k = (18 - 15) / 2500² = 4.8 × 10⁻⁷
```

**Implementation:**
```python
def __init__(self, design: DesignPoint):
    self.shutoff_head = design.head * 1.2  # 18m
    self.k = (self.shutoff_head - design.head) / (design.flow ** 2)

def head_at_flow(self, flow: float, current_rpm: float) -> float:
    speed_ratio = current_rpm / self.design.max_rpm
    scaled_shutoff = self.shutoff_head * (speed_ratio ** 2)
    scaled_k = self.k * (speed_ratio ** 2)
    head = scaled_shutoff - scaled_k * (flow ** 2)
    return max(0.0, head)
```

### Characteristic Curve Points

| Flow (m³/h) | Head at 1180 RPM (m) | Head at 944 RPM (m) | Head at 590 RPM (m) |
|-------------|----------------------|---------------------|---------------------|
| 0 (Shutoff) | 18.0 | 11.5 | 4.5 |
| 1000 | 17.5 | 11.2 | 4.4 |
| 2000 | 16.1 | 10.3 | 4.0 |
| 2500 (BEP) | 15.0 | 9.6 | 3.75 |
| 3000 | 13.7 | 8.8 | 3.4 |

**Source:** `simulation/physics.py:84-106`

---

## 4. Power Consumption Models

Power consumption is calculated in three stages: hydraulic power, shaft power, and electrical power.

### 4.1 Hydraulic Power (Water Power)

The useful work done on the fluid:

```
P_hydraulic = (ρ × g × Q × H) / 1000   [kW]
```

Where:
- **ρ** = Water density = 998 kg/m³
- **g** = Gravitational acceleration = 9.81 m/s²
- **Q** = Flow rate in m³/s (convert from m³/h by dividing by 3600)
- **H** = Total Dynamic Head in meters
- **Result** = Power in kW

**Implementation:**
```python
def calculate_hydraulic_power(self, flow: float, head: float) -> float:
    WATER_DENSITY = 998.0  # kg/m³
    GRAVITY = 9.81         # m/s²
    flow_m3s = flow / 3600.0
    power = WATER_DENSITY * GRAVITY * flow_m3s * head / 1000.0
    return power
```

**Example at BEP:**
- Q = 2500 m³/h = 0.694 m³/s
- H = 15 m
- P_hydraulic = (998 × 9.81 × 0.694 × 15) / 1000 = **101.5 kW**

### 4.2 Shaft Power (Brake Power)

The mechanical power required at the pump shaft:

```
P_shaft = P_hydraulic / η_pump
```

**Example:**
- P_shaft = 101.5 / 0.84 = **120.8 kW**

### 4.3 Electrical Power (Motor Input)

The total electrical power consumed by the motor:

```
P_electrical = P_shaft / η_motor
```

**Example:**
- P_electrical = 120.8 / 0.954 = **126.6 kW**

**Source:** `simulation/physics.py:108-150`

---

## 5. Efficiency Calculations

### 5.1 Pump Efficiency Model (Bell Curve)

Pump efficiency peaks at BEP and decreases when operating at off-design conditions:

```
η = η_max × [1 - ((Q - Q_BEP) / Q_BEP)² × 0.5]
```

Where:
- **η_max** = Maximum efficiency at BEP (84%)
- **Q** = Current flow rate
- **Q_BEP** = Flow at BEP (adjusted for speed)

**Implementation:**
```python
def estimate_efficiency(self, flow: float, current_rpm: float) -> float:
    speed_ratio = current_rpm / self.design.max_rpm
    bep_flow = self.design.flow * speed_ratio

    flow_deviation = (flow - bep_flow) / bep_flow
    efficiency = self.design.efficiency * (1.0 - (flow_deviation ** 2) * 0.5)

    return max(20.0, min(self.design.efficiency, efficiency))
```

### Efficiency vs Flow Deviation Table

| Flow (% of BEP) | Efficiency (%) | Notes |
|-----------------|----------------|-------|
| 50% | 72.0 | Low flow - increased recirculation |
| 75% | 81.5 | Acceptable range |
| 100% (BEP) | **84.0** | Maximum efficiency |
| 110% | 82.5 | Slightly above BEP |
| 125% | 78.0 | High flow - increased cavitation risk |
| 150% | 72.0 | Beyond recommended operating range |

### 5.2 Power Factor Model

Power factor varies with motor load:

```python
def estimate_power_factor(self, load_fraction: float) -> float:
    if load_fraction < 0.25:
        return 0.65 + load_fraction * 0.4    # PF = 0.65-0.75
    elif load_fraction < 1.0:
        return 0.75 + load_fraction * 0.15   # PF = 0.75-0.90
    else:
        return 0.90                           # PF = 0.90 (max)
```

| Load (%) | Power Factor |
|----------|--------------|
| 0% | 0.65 |
| 25% | 0.75 |
| 50% | 0.825 |
| 75% | 0.8625 |
| 100% | 0.90 |

**Source:** `simulation/physics.py:152-197`

---

## 6. Electrical System Models

### 6.1 Motor Current Calculation

For a 3-phase motor:

```
I = (P × 1000) / (√3 × V × PF)   [Amps]
```

Where:
- **P** = Power in kW
- **V** = Voltage (480V typical)
- **PF** = Power factor
- **√3** = 1.732 (3-phase factor)

**Implementation:**
```python
def calculate_motor_current(self, power_kw: float, voltage: float,
                            power_factor: float = 0.85) -> float:
    current = (power_kw * 1000) / (math.sqrt(3) * voltage * power_factor)
    return current
```

**Example at BEP:**
- I = (126.6 × 1000) / (1.732 × 480 × 0.85) = **180 A**
- Full Load Amps (FLA) = 225 A (design specification)

### 6.2 VFD Output Frequency

The relationship between motor RPM and electrical frequency:

```
f = (RPM × Poles) / 120   [Hz]
```

**For 6-pole motor (1180 RPM synchronous):**
- At 1180 RPM: f = (1180 × 6) / 120 = **59 Hz** ≈ 60 Hz
- At 944 RPM: f = (944 × 6) / 120 = **47.2 Hz**
- At 590 RPM: f = (590 × 6) / 120 = **29.5 Hz** ≈ 30 Hz

**Implementation:**
```python
def calculate_vfd_frequency(self, current_rpm: float) -> float:
    poles = 6  # 6-pole for 1180 RPM synchronous
    if self.design.max_rpm > 1500:
        poles = 4  # 4-pole for 1750 RPM
    frequency = (current_rpm * poles) / 120.0
    return min(65.0, max(0.0, frequency))
```

**Source:** `simulation/physics.py:174-211`

---

## 7. Pressure Calculations

### 7.1 Suction Pressure

```
P_suction = (H_static / 10.2) - f_loss + noise   [bar]
```

Where:
- **H_static** = Wet well depth (3m typical) → 0.294 bar
- **f_loss** = Friction loss = 0.1 × (Q/Q_design)²
- **1 bar ≈ 10.2 m water column**

**Implementation:**
```python
def calculate_suction_pressure(self, static_head: float = 3.0,
                               flow: float = 0.0,
                               design_flow: float = 2500.0) -> float:
    static_p = static_head / 10.2
    friction_loss = 0.1 * (flow / design_flow) ** 2
    noise = random.uniform(-0.02, 0.02)
    pressure = static_p - friction_loss + noise
    return max(-0.5, min(2.0, pressure))
```

**Range:** -0.5 to 2.0 bar (negative indicates vacuum/cavitation risk)

### 7.2 Discharge Pressure

```
P_discharge = P_suction + (H / 10.2)   [bar]
```

**Implementation:**
```python
def calculate_discharge_pressure(self, suction_pressure: float,
                                  head: float) -> float:
    head_bar = head / 10.2  # Convert meters to bar
    return suction_pressure + head_bar
```

**Example at BEP:**
- P_discharge = 0.3 + (15 / 10.2) = **1.77 bar**

**Source:** `simulation/physics.py:326-360`

---

## 8. Vibration Modeling

### 8.1 Total Vibration Calculation

```
V_total = V_base + V_imbalance + V_bearing + V_flow + V_noise   [mm/s]
```

**Component Breakdown:**

| Component | Formula | Description |
|-----------|---------|-------------|
| **Base Vibration** | 2.0 × (RPM/RPM_max) mm/s | Normal operational vibration |
| **Imbalance** | 0.5 × factor × (RPM/RPM_max) mm/s | Rotor imbalance (1× RPM) |
| **Bearing** | 0.3 × (condition-1.0) × (RPM/RPM_max) mm/s | Bearing wear contribution |
| **Flow-Induced** | \|flow_deviation\| × 1.5 mm/s | Hydraulic vibration from off-BEP operation |
| **Noise** | ±10% of base vibration | Random measurement noise |

**Implementation:**
```python
def calculate_vibration(self, rpm: float, imbalance_factor: float = 1.0,
                        bearing_condition: float = 1.0,
                        flow_deviation: float = 0.0) -> float:
    if rpm == 0:
        return 0.1  # Baseline noise

    speed_ratio = rpm / self.design.max_rpm
    base_vibration = 2.0 * speed_ratio
    imbalance = 0.5 * imbalance_factor * speed_ratio
    bearing = 0.3 * (bearing_condition - 1.0) * speed_ratio
    flow_vib = abs(flow_deviation) * 1.5
    noise = random.uniform(-0.1, 0.1) * base_vibration

    total = base_vibration + imbalance + bearing + flow_vib + noise
    return max(0.3, min(30.0, total))
```

### ISO 10816 Vibration Severity Zones

| Zone | Vibration (mm/s RMS) | Assessment |
|------|----------------------|------------|
| **A** (Good) | < 7.1 | New or recently reconditioned |
| **B** (Acceptable) | 7.1 - 11.2 | Acceptable for long-term operation |
| **C** (Just Tolerable) | 11.2 - 18.0 | Restricted long-term operation |
| **D** (Unacceptable) | > 18.0 | Damage may occur |

**Source:** `simulation/physics.py:213-251`

---

## 9. Temperature Models

### 9.1 Motor Winding Temperature

Temperature rise follows I² relationship (copper losses):

```
T_winding = T_ambient + 80 × (I / FLA)² + noise   [°C]
```

**Implementation:**
```python
def calculate_motor_winding_temp(self, ambient: float, current: float,
                                  full_load_amps: float) -> float:
    load_fraction = current / full_load_amps
    temp_rise = 80.0 * (load_fraction ** 2)  # Class F insulation
    noise = random.uniform(-2.0, 2.0)
    temp = ambient + temp_rise + noise
    return max(ambient, min(180.0, temp))
```

**Class F Insulation Limits:**
- Maximum allowable: 155°C
- Typical rise at FLA: 80°C
- Safety margin: 25°C

### 9.2 Bearing Temperature

```
T_bearing = T_ambient + (P_kW × 0.15) + (V_mm/s × 2.0) + (W_factor × 15.0)   [°C]
```

Where:
- **P_kW** = Shaft power (heat from bearing friction ~2% of power)
- **V_mm/s** = Vibration (higher vibration = more friction heat)
- **W_factor** = Wear factor (0-1, increases friction)

**Implementation:**
```python
def calculate_bearing_temp(self, ambient: float, power_kw: float,
                           vibration: float, wear_factor: float = 0.0) -> float:
    power_rise = power_kw * 0.15
    vibration_rise = vibration * 2.0
    wear_rise = wear_factor * 15.0
    noise = random.uniform(-1.0, 1.0)
    temp = ambient + power_rise + vibration_rise + wear_rise + noise
    return max(ambient, min(150.0, temp))
```

### 9.3 Seal Chamber Temperature

```
T_seal = T_ambient + 5.0 + T_low_flow + T_wear   [°C]
```

**Low Flow Penalty:**
- If flow < 50% design: Additional 20°C rise (seal chamber overheating)

**Implementation:**
```python
def calculate_seal_temp(self, ambient: float, flow: float,
                        design_flow: float, wear_factor: float = 0.0) -> float:
    base_temp = ambient + 5.0

    if design_flow > 0 and flow < design_flow * 0.5:
        flow_ratio = flow / (design_flow * 0.5)
        low_flow_rise = (1.0 - flow_ratio) * 20.0
    else:
        low_flow_rise = 0.0

    wear_rise = wear_factor * 10.0
    return base_temp + low_flow_rise + wear_rise
```

**Source:** `simulation/physics.py:253-324`

---

## 10. Simulation Modes

The simulation supports 4 distinct operating modes to model various equipment conditions.

### 10.1 OPTIMAL Mode (Mode 0)

**New pump at manufacturer specifications**

| Factor | Value | Description |
|--------|-------|-------------|
| Efficiency Factor | 1.0 | No degradation |
| Vibration Factor | 1.0 | Normal levels |
| Temperature Offset | 0°C | No additional heat |
| Flow Reduction | 1.0 | No capacity loss |

### 10.2 AGED Mode (Mode 1)

**5-year simulated wear with realistic degradation**

**Configuration:**
```python
@dataclass
class AgedConfig:
    years_of_operation: float = 5.0
    average_run_hours_per_year: float = 6000.0
    start_cycles_per_year: int = 500
```

**Degradation Factors:**

| Factor | Formula | 5-Year Value |
|--------|---------|--------------|
| **Efficiency** | 1.0 - (years × 0.006) | 0.97 (3% loss) |
| **Vibration** | 1.0 + (years × 0.1) | 1.5 (50% increase) |
| **Temperature** | +5.0°C fixed offset | +5°C |
| **Flow Capacity** | 0.97 (fixed) | 3% reduction |

### 10.3 DEGRADED Mode (Mode 2)

**Configurable wear parameters for specific failure simulation**

**Configuration:**
```python
@dataclass
class DegradedConfig:
    impeller_wear: float = 15.0    # % clearance increase (0-50)
    bearing_wear: float = 20.0     # % damage (0-100)
    seal_wear: float = 25.0        # % degradation (0-100)
```

**Factor Calculations:**

| Parameter | Effect Formula |
|-----------|----------------|
| **Impeller Wear** | Efficiency = 1.0 - (wear% / 100) |
| **Impeller Wear** | Flow = 1.0 - (wear% / 200) |
| **Bearing Wear** | Vibration = 1.0 + (wear% / 50) |
| **Bearing Wear** | Temp = wear% × 0.3 °C |
| **Seal Wear** | Seal temp rise = wear% × 0.1 °C |

**Example:** 20% bearing wear → Vibration × 1.4, +6°C temperature

### 10.4 FAILURE Mode (Mode 3)

**Progressive failure simulation with time-based deterioration**

**Configuration:**
```python
@dataclass
class FailureConfig:
    failure_type: FailureType = FailureType.NONE
    failure_progression: float = 0.0  # % (0-100)
    time_to_failure: float = 100.0    # hours
```

**Failure Types:**

| Type | Vibration Effect | Temperature Effect | Flow Effect |
|------|------------------|-------------------|-------------|
| **BEARING** | 1.0 + (prog% × 5.0) = up to 6× | +prog% × 0.5°C | None |
| **SEAL** | Normal | +prog% × 0.8°C | Minor |
| **CAVITATION** | Normal | Minimal | 1.0 - (prog% / 200) |
| **IMPELLER** | 1.0 + (prog% × 3.0) = up to 4× | Minimal | 1.0 - (prog% / 150) |
| **MOTOR** | Normal | +prog% × 0.8°C | None |

**Source:** `simulation/modes.py:1-191`

---

## 11. 3D Visualization Physics

The 3D visualization uses **React Three Fiber** with realistic physics models.

### 11.1 Impeller Rotation

The impeller rotation speed is synchronized with OPC-UA RPM feedback:

```typescript
useFrame((state, delta) => {
    if (groupRef.current) {
        // Convert RPM to radians per second
        const rotationSpeed = (rpm * Math.PI * 2) / 60;
        groupRef.current.rotation.y += rotationSpeed * delta;
    }
});
```

**Formula:** ω = (RPM × 2π) / 60 rad/s

### 11.2 Water Surface Physics

The wet well water surface uses sine wave animation based on pump activity:

```typescript
useFrame((state) => {
    const time = state.clock.getElapsedTime();

    // Agitation proportional to flow rate
    const agitation = isRunning ? (0.02 + (flowRate / 5000) * 0.08) : 0.005;

    // Apply sine wave displacement
    for (let i = 0; i < position.count; i++) {
        const x = position.getX(i);
        const y = position.getY(i);
        const z = Math.sin(x * 2 + time * 3) * agitation +
                  Math.cos(y * 2 + time * 2.5) * agitation;
        position.setZ(i, z);
    }
});
```

### 11.3 Hydrodynamic Particle Flow

Flow particles follow a 3-stage path:

1. **Suction Path (t < 1.5):** Horizontal approach from wet well
2. **Volute Spiral (1.5 < t < 2.2):** Accelerating through impeller
3. **Discharge Path (t > 2.2):** Vertical exit to channel

```typescript
// Particle speed varies with flow rate
p.t += delta * p.speed * (0.4 + flowFactor * 2.5);

// Volute spiral path
const spiral = (cycle - 1.5) * Math.PI * 6;
const radius = 0.1 + (cycle - 1.5) * 0.7;
x = Math.cos(spiral) * radius;
y = Math.sin(spiral) * radius;
```

**Source:** `ui/src/components/pumps/pump-3d-viewer.tsx:25-183`

---

## 12. Pump Curve Generation for UI

The frontend generates dynamic pump curves using real-time OPC-UA data.

### 12.1 Curve Constants

```typescript
const BEP_FLOW = 2800;     // m³/h (slightly different for UI)
const MAX_HEAD = 45;       // meters (extended range)
const BEP_EFF = 84;        // %
```

### 12.2 Affinity Law Adjustment

```typescript
// Speed adjustment factor
const rpmFactor = pump.rpm / 1200;

// Adjusted parameters per affinity laws
const adjMaxHead = MAX_HEAD * Math.pow(rpmFactor, 2);   // H ∝ N²
const adjBepFlow = BEP_FLOW * rpmFactor;                 // Q ∝ N
```

### 12.3 Curve Point Generation

25 points generated for smooth curve rendering:

```typescript
const points = Array.from({ length: 25 }, (_, i) => {
    const q = i * 200;  // 0 to 4800 m³/h

    // Head: H = H0 - kQ² (parabolic)
    const head = adjMaxHead - (adjMaxHead * 0.4 * Math.pow(q / adjBepFlow, 2));

    // Efficiency: Bell curve centered at BEP
    const eff = BEP_EFF * (1 - Math.pow((q - adjBepFlow) / adjBepFlow, 2));

    // Power: P = ρgQH / η (derived from hydraulic formula)
    const p = (q * head * 9.81 * 1000) / (3600 * eff * 0.01 * 1000);

    // System resistance curve: H_sys = H_static + kQ²
    const system = static_lift + 0.000002 * Math.pow(q, 2);

    return { q, head, efficiency: eff, power: p, system };
});
```

### 12.4 Operating Point Calculation

The live operating point is where pump curve intersects system curve:

```typescript
// Head from pressure measurement
const head_m = pump.discharge_pressure * 10.197;  // bar to meters

// Static lift calculation
const static_lift = 12 - (pump.wet_well_level || 4.2);  // m

// Real-time efficiency
const η = (q_m3s * p_pa / power_w) * 100;  // %
```

**Source:** `ui/src/app/pumps/[id]/3d/page.tsx:56-102`

---

## 13. Diurnal Flow Profile

The simulation models realistic 24-hour municipal wastewater flow patterns.

### 13.1 Hourly Flow Multipliers

```python
HOURLY_FLOW_MULTIPLIERS = {
    0: 0.60,  1: 0.55,  2: 0.50,  3: 0.50,  4: 0.55,  5: 0.70,
    6: 1.00,  7: 1.30,  8: 1.40,  9: 1.20, 10: 1.00, 11: 0.95,
   12: 1.10, 13: 1.15, 14: 1.00, 15: 0.90, 16: 0.95, 17: 1.00,
   18: 1.20, 19: 1.30, 20: 1.20, 21: 1.00, 22: 0.85, 23: 0.70
}
```

### 13.2 Flow Pattern Visualization

```
Flow (% of design)
  ^
140%|             *8AM
130%|          *     *7PM
120%|       *           *
110%|                 *
100%|    *        *       *
 90%|                       *
 80%|
 70%|  *                       *
 60%|*                           *
 50%|   ***                        *
    +--+--+--+--+--+--+--+--+--+--+--+--> Hour
    0  2  4  6  8  10 12 14 16 18 20 22
```

### 13.3 Configuration Options

```python
@dataclass
class FlowProfileConfig:
    diurnal_enabled: bool = True
    base_flow: float = 1600.0    # m³/h (minimum)
    peak_flow: float = 4000.0    # m³/h (maximum)
    peak_hour_1: int = 7         # Morning peak
    peak_hour_2: int = 19        # Evening peak
```

**Source:** `simulation/modes.py:66-190`

---

## 14. Simulating Real-World Scenarios

Rather than waiting for real-time diurnal patterns, you can manipulate simulation parameters to immediately test various operational scenarios.

### 14.1 Quick Scenario Controls

#### Via REST API (if configured):

```bash
# Change simulation mode
curl -X POST http://localhost:8080/api/simulation/mode \
  -H "Content-Type: application/json" \
  -d '{"mode": "OPTIMAL"}'

# Set specific degradation parameters
curl -X POST http://localhost:8080/api/simulation/degraded \
  -d '{"impeller_wear": 30, "bearing_wear": 40, "seal_wear": 20}'

# Trigger failure scenario
curl -X POST http://localhost:8080/api/simulation/failure \
  -d '{"type": "BEARING", "time_to_failure": 10}'
```

#### Via OPC-UA Client (UaExpert, Prosys, etc.):

Navigate to the simulation control nodes and modify:

| Node Path | Parameter | Effect |
|-----------|-----------|--------|
| `SimulationConfig/Mode` | 0-3 | Change simulation mode |
| `SimulationConfig/TimeAcceleration` | 1.0-100.0 | Speed up simulation time |
| `SimulationConfig/SimulationInterval` | 10-10000 ms | Update frequency |
| `DegradedConfig/ImpellerWear` | 0-50% | Clearance increase |
| `DegradedConfig/BearingWear` | 0-100% | Vibration/temp effects |
| `DegradedConfig/SealWear` | 0-100% | Seal chamber temp rise |

### 14.2 High Flow Season Simulation

**Scenario:** Simulate spring melt or storm event with 150% normal flow

**Method 1: Time Acceleration**
```python
# In simulation engine
mode_params.time_acceleration = 10.0  # 10× faster time
# 1 hour real time = 10 simulated hours
```

**Method 2: Direct Flow Override**
```python
# In pump simulation
pump.target_flow_ratio = 1.5  # 150% of normal diurnal pattern
```

**Method 3: Modify Wet Well Level**
```python
# Higher wet well = higher suction head
pump.wet_well_level = 8.0  # meters (max 10m)
# Creates higher static head, pump works harder
```

### 14.3 Drought/Low Flow Simulation

**Scenario:** Summer low-flow conditions

```python
# Set minimum flow conditions
pump.target_flow_ratio = 0.5  # 50% flow

# Effects observed:
# - Efficiency drops (operating off-BEP)
# - Seal chamber temperature rises (reduced cooling)
# - Flow-induced vibration may increase
```

### 14.4 Aging Simulation (Accelerated)

**Scenario:** Test predictive maintenance algorithms with accelerated aging

```python
# Apply 10 years of wear instantly
mode_params.mode = SimulationMode.AGED
mode_params.aged_config.years_of_operation = 10.0

# Effects:
# - Efficiency: 94% (6% degradation)
# - Vibration: 2× baseline
# - Temperature: +10°C offset
# - Flow capacity: 97%
```

### 14.5 Failure Progression Test

**Scenario:** Test bearing failure detection over accelerated time

```python
mode_params.mode = SimulationMode.FAILURE
mode_params.failure_config.failure_type = FailureType.BEARING
mode_params.failure_config.time_to_failure = 1.0  # 1 hour to failure

# With time_acceleration = 60:
# - Full failure progression in 1 minute real time
# - Vibration increases from 2 mm/s → 12 mm/s
# - Temperature rises progressively
```

### 14.6 Parameter Impact Summary

| Scenario | Parameters to Modify | Observable Effects |
|----------|---------------------|-------------------|
| **High Flow (Storm)** | `target_flow_ratio=1.5`, `wet_well_level=8.0` | Power ↑, Current ↑, Head ↓ |
| **Low Flow (Drought)** | `target_flow_ratio=0.5`, `wet_well_level=2.0` | Efficiency ↓, Seal Temp ↑ |
| **Peak Morning** | `time_acceleration=60` (wait 7 mins) | Follows 7AM peak pattern |
| **Worn Impeller** | `degraded.impeller_wear=40` | Flow ↓ 20%, Efficiency ↓ 40% |
| **Bad Bearing** | `degraded.bearing_wear=60` | Vibration ×2.2, Temp +18°C |
| **Cavitation** | `wet_well_level=0.5`, `rpm=max` | Suction pressure drops, noise ↑ |
| **Motor Overload** | `failure.type=MOTOR`, `progression=80` | Winding temp → 140°C+ |

### 14.7 Complete Test Sequence Example

```python
# Test sequence for predictive maintenance algorithm validation

# Phase 1: Baseline (10 minutes)
engine.set_mode(SimulationMode.OPTIMAL)
await asyncio.sleep(600)

# Phase 2: Early wear detection (10 minutes)
engine.set_mode(SimulationMode.DEGRADED)
engine.mode_params.degraded_config.bearing_wear = 20.0
await asyncio.sleep(600)

# Phase 3: Progressive failure (5 minutes with acceleration)
engine.set_mode(SimulationMode.FAILURE)
engine.mode_params.failure_config.failure_type = FailureType.BEARING
engine.mode_params.failure_config.time_to_failure = 5.0
engine.mode_params.time_acceleration = 60.0
await asyncio.sleep(300)  # Full failure in 5 mins

# Phase 4: Recovery
engine.reset_simulation()
```

---

## Appendix A: Quick Reference Formulas

| Calculation | Formula | Source |
|-------------|---------|--------|
| Flow at Speed | Q₂ = Q₁ × (N₂/N₁) | Affinity Law 1 |
| Head at Speed | H₂ = H₁ × (N₂/N₁)² | Affinity Law 2 |
| Power at Speed | P₂ = P₁ × (N₂/N₁)³ | Affinity Law 3 |
| Pump Curve | H = H₀(N/Nₘₐₓ)² - kQ² | H-Q Relationship |
| Hydraulic Power | P = ρgQH/1000 | Energy transfer |
| Motor Current | I = P/(√3·V·PF) | 3-phase power |
| VFD Frequency | f = (RPM × poles)/120 | Electrical sync |
| Efficiency | η = ηₘₐₓ[1-((Q-Qbep)/Qbep)²×0.5] | Bell curve model |
| Suction Pressure | Ps = h/10.2 - friction | Static head - losses |
| Vibration | V = Vbase + Vimbal + Vbear + Vflow | Multi-component |
| Winding Temp | T = Tamb + 80(I/FLA)² | I² heating |

---

## Appendix B: OPC-UA Data Points (27 per pump)

| Category | Variables | Units |
|----------|-----------|-------|
| **Flow** | FlowRate | m³/h |
| **Pressure** | SuctionPressure, DischargePressure | bar |
| **Electrical** | RPM, MotorCurrent, Voltage, PowerConsumption, PowerFactor, VFDFrequency | RPM, A, V, kW, -, Hz |
| **Temperature** | MotorWindingTemp, BearingTemp_DE, BearingTemp_NDE, SealChamberTemp, AmbientTemp | °C |
| **Vibration** | Vibration_DE_H/V/A, Vibration_NDE_H/V/A | mm/s RMS |
| **Counters** | RuntimeHours, StartCount | hours, count |
| **Status** | RunCommand, RunFeedback, FaultStatus, ReadyStatus, LocalRemote | Boolean |
| **Level** | WetWellLevel | m |

---

*Document generated from analysis of OPC-UA Wastewater Treatment Pump Simulation Platform*
*Source files: simulation/physics.py, simulation/modes.py, simulation/pump.py, simulation/engine.py, ui/src/app/pumps/[id]/3d/page.tsx*
