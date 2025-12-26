# Wastewater Influent Pump Simulation Specification

## 1. Overview

### 1.1 Purpose
Simulate a realistic wastewater treatment facility influent pump handling 10-30 MGD (Million Gallons per Day). The OPC-UA server exposes **raw sensor data only** (as a real PLC would), enabling external analytics platforms to:
- Calculate efficiency and pump curves
- Perform predictive maintenance analysis
- Track performance degradation
- Predict failures

### 1.2 Simulation Modes
The server supports configurable operation modes that affect the underlying physics model:

| Mode | Description |
|------|-------------|
| `OPTIMAL` | Pump running at manufacturer design parameters (new pump) |
| `AGED` | Pump after ~5 years of operation with typical wear |
| `DEGRADED` | Configurable performance degradation |
| `FAILURE` | Simulates conditions leading to pump failure |

### 1.3 Data Philosophy
This simulation exposes only data that would come from **real sensors/PLCs**:
- Flow meters, pressure transmitters, RTDs, accelerometers
- VFD feedback (speed, current, voltage, power)
- PLC counters (runtime, starts)

**Not included in OPC-UA** (calculated externally by analytics systems):
- Efficiency calculations
- Pump curves
- Health scores, RUL predictions
- Failure probabilities
- BEP comparisons

---

## 2. Pump Design Parameters (10-30 MGD Influent Pump)

These are **reference values** used internally by the simulation physics model.

### 2.1 Hydraulic Specifications

| Parameter | Value | Unit | Notes |
|-----------|-------|------|-------|
| Design Flow (BEP) | 2,500 | m³/h | ~15.8 MGD at Best Efficiency Point |
| Flow Range | 1,600 - 4,700 | m³/h | 10-30 MGD operating range |
| Design Head (TDH) | 15 | m | Total Dynamic Head |
| Head Range | 10 - 20 | m | Varies with wet well level |
| Suction Head | -2 to +3 | m | Wet well level dependent |
| NPSH Required | 4.5 | m | At design flow |
| NPSH Available | 7.0 | m | Minimum at low wet well |

### 2.2 Motor Specifications

| Parameter | Value | Unit | Notes |
|-----------|-------|------|-------|
| Motor Power | 150 | kW | ~200 HP |
| Rated Voltage | 480 | V | 3-phase |
| Full Load Amps (FLA) | 225 | A | |
| Motor Speed | 1,180 | RPM | 6-pole, 60Hz |
| VFD Speed Range | 600 - 1,180 | RPM | 50-100% speed |
| Power Factor | 0.87 | - | At full load |
| Motor Efficiency | 95.4 | % | Premium efficiency |

### 2.3 Mechanical Specifications

| Parameter | Value | Unit | Notes |
|-----------|-------|------|-------|
| Impeller Diameter | 450 | mm | Closed impeller |
| Impeller Material | Duplex SS | - | 2205 grade |
| Shaft Seal Type | Mechanical | - | Double cartridge |
| Bearing Type | Angular Contact | - | Oil lubricated |
| Pump Weight | 2,800 | kg | Dry weight |

---

## 3. OPC-UA Data Points (Raw Sensor Data)

### 3.1 Flow Measurement
*Source: Magnetic flow meter on discharge line*

| Node Name | DataType | Unit | Range | Update Rate |
|-----------|----------|------|-------|-------------|
| `FlowRate` | Double | m³/h | 0 - 5,000 | 1s |

### 3.2 Pressure Measurements
*Source: Pressure transmitters*

| Node Name | DataType | Unit | Range | Update Rate | Sensor Location |
|-----------|----------|------|-------|-------------|-----------------|
| `SuctionPressure` | Double | bar | -0.5 - 1.0 | 1s | Pump inlet flange |
| `DischargePressure` | Double | bar | 0 - 3.0 | 1s | Pump outlet flange |

### 3.3 VFD / Motor Electrical Data
*Source: Variable Frequency Drive feedback*

| Node Name | DataType | Unit | Range | Update Rate |
|-----------|----------|------|-------|-------------|
| `RPM` | Double | rpm | 0 - 1,200 | 1s |
| `MotorCurrent` | Double | A | 0 - 300 | 1s |
| `Voltage` | Double | V | 0 - 520 | 1s |
| `PowerConsumption` | Double | kW | 0 - 180 | 1s |
| `PowerFactor` | Double | - | 0 - 1.0 | 1s |
| `VFDFrequency` | Double | Hz | 0 - 60 | 1s |

### 3.4 Temperature Measurements
*Source: RTDs (Resistance Temperature Detectors)*

| Node Name | DataType | Unit | Range | Update Rate | Sensor Location |
|-----------|----------|------|-------|-------------|-----------------|
| `MotorWindingTemp` | Double | °C | 0 - 180 | 5s | Motor stator winding |
| `BearingTemp_DE` | Double | °C | 0 - 120 | 5s | Drive end bearing housing |
| `BearingTemp_NDE` | Double | °C | 0 - 120 | 5s | Non-drive end bearing housing |
| `SealChamberTemp` | Double | °C | 0 - 100 | 5s | Mechanical seal chamber |
| `AmbientTemp` | Double | °C | -10 - 50 | 60s | Pump room ambient |

### 3.5 Vibration Measurements
*Source: Accelerometers mounted on bearing housings*

| Node Name | DataType | Unit | Range | Update Rate | Measurement |
|-----------|----------|------|-------|-------------|-------------|
| `Vibration_DE_H` | Double | mm/s | 0 - 30 | 1s | Drive end - Horizontal |
| `Vibration_DE_V` | Double | mm/s | 0 - 30 | 1s | Drive end - Vertical |
| `Vibration_DE_A` | Double | mm/s | 0 - 30 | 1s | Drive end - Axial |
| `Vibration_NDE_H` | Double | mm/s | 0 - 30 | 1s | Non-drive end - Horizontal |
| `Vibration_NDE_V` | Double | mm/s | 0 - 30 | 1s | Non-drive end - Vertical |
| `Vibration_NDE_A` | Double | mm/s | 0 - 30 | 1s | Non-drive end - Axial |

### 3.6 Runtime Counters
*Source: PLC accumulated values*

| Node Name | DataType | Unit | Range | Update Rate |
|-----------|----------|------|-------|-------------|
| `RuntimeHours` | Double | hours | 0 - 200,000 | 60s |
| `StartCount` | UInt32 | - | 0 - 1,000,000 | On change |

### 3.7 Discrete Status
*Source: PLC digital I/O*

| Node Name | DataType | Values | Update Rate |
|-----------|----------|--------|-------------|
| `RunCommand` | Boolean | true/false | On change |
| `RunFeedback` | Boolean | true/false | On change |
| `FaultStatus` | Boolean | true/false | On change |
| `ReadyStatus` | Boolean | true/false | On change |
| `LocalRemote` | Boolean | true=Remote | On change |

### 3.8 Wet Well Level
*Source: Level transmitter (provides context for pump operation)*

| Node Name | DataType | Unit | Range | Update Rate |
|-----------|----------|------|-------|-------------|
| `WetWellLevel` | Double | m | 0 - 8 | 5s |

---

## 4. Design Specifications Node (Static Reference Data)

These are static values representing manufacturer nameplate data, useful for analytics systems.

```
DesignSpecs/
├── DesignFlow          # Double: 2500 m³/h
├── DesignHead          # Double: 15.0 m
├── DesignPower         # Double: 150 kW
├── MaxRPM              # UInt32: 1180 rpm
├── MinRPM              # UInt32: 600 rpm
├── FullLoadAmps        # Double: 225 A
├── RatedVoltage        # UInt32: 480 V
├── ImpellerDiameter    # Double: 450 mm
├── NPSHRequired        # Double: 4.5 m
├── ManufacturerBEP_Eff # Double: 84.0 %
└── InstallationDate    # DateTime
```

---

## 5. Simulation Configuration

### 5.1 SimulationConfig Node Structure

```
SimulationConfig/
├── Mode                    # String: OPTIMAL, AGED, DEGRADED, FAILURE
├── SimulationInterval      # Double: Update interval in ms (default 1000)
├── TimeAcceleration        # Double: Time multiplier (1.0 = real-time, 60 = 1 min = 1 hour)
├── AgedConfig/
│   ├── YearsOfOperation    # Double: Simulated years (default 5.0)
│   ├── AverageRunHoursPerYear  # Double: Hours/year (default 6,000)
│   ├── StartCyclesPerYear  # UInt32: Starts/year (default 500)
│   └── ApplyAging          # Method: Trigger aging calculation
├── DegradedConfig/
│   ├── ImpellerWear        # Double: % clearance increase (0-50, default 15)
│   ├── BearingWear         # Double: % damage (0-100, default 20)
│   ├── SealWear            # Double: % degradation (0-100, default 25)
│   └── ApplyDegradation    # Method: Apply degradation settings
├── FailureConfig/
│   ├── FailureType         # String: BEARING, SEAL, CAVITATION, IMPELLER, MOTOR
│   ├── FailureProgression  # Double: % through failure sequence (0-100)
│   ├── TimeToFailure       # Double: Simulated hours until complete failure
│   └── TriggerFailure      # Method: Initiate failure sequence
└── FlowProfile/
    ├── DiurnalEnabled      # Boolean: Enable daily flow pattern
    ├── BaseFlow            # Double: Minimum demand m³/h (default 1600)
    ├── PeakFlow            # Double: Maximum demand m³/h (default 4000)
    ├── PeakHour1           # UInt32: Morning peak hour (default 7)
    └── PeakHour2           # UInt32: Evening peak hour (default 19)
```

### 5.2 Simulation Mode Behavior

#### OPTIMAL Mode (New Pump)
The physics model produces sensor values consistent with:
- New pump operating at manufacturer specifications
- Baseline vibration: 1.5-2.5 mm/s RMS
- Nominal temperatures under load
- RuntimeHours starts at 0
- Sensors show clean, stable readings

#### AGED Mode (5-Year Operation)
Applies wear factors to physics model:
- RuntimeHours: ~30,000 hours (based on config)
- StartCount: ~2,500
- Increased power draw for same flow (worn impeller clearances)
- Higher vibration baseline: 2.5-4.0 mm/s
- Slightly elevated bearing temperatures
- More pressure fluctuation

#### DEGRADED Mode (Configurable Wear)
User-configurable wear factors affect sensor outputs:
- `ImpellerWear`: Reduces head/flow, increases power
- `BearingWear`: Increases vibration and temperature
- `SealWear`: Increases seal chamber temperature
- Sensors show degraded but operational values

#### FAILURE Mode (Progressive Failure)
Simulates sensor signatures of impending failure:

| Failure Type | Sensor Symptoms |
|--------------|-----------------|
| `BEARING` | Rising vibration (exponential), bearing temp spike, erratic readings |
| `SEAL` | Seal chamber temp rise, pressure fluctuations |
| `CAVITATION` | Erratic flow, pressure noise, vibration spikes at flow extremes |
| `IMPELLER` | Gradual flow/pressure reduction, power increase |
| `MOTOR` | Current imbalance, winding temp rise, power factor drop |

---

## 6. Internal Physics Models

These models are used internally to generate realistic sensor values. They are **not exposed via OPC-UA**.

### 6.1 Pump Affinity Laws (VFD Speed Variation)
```
Q₂/Q₁ = N₂/N₁
H₂/H₁ = (N₂/N₁)²
P₂/P₁ = (N₂/N₁)³
```

### 6.2 Head-Flow Relationship
```
H = H_shutoff - k × Q²

Where:
  H_shutoff = 22.5 m (at zero flow)
  k = coefficient based on impeller geometry
```

### 6.3 Power Model
```
P = (ρ × g × Q × H) / (η_pump × η_motor × 1000)

With wear adjustment:
  η_pump_actual = η_pump_design × (1 - WearFactor)
```

### 6.4 Vibration Model
```
V_total = √(V_mechanical² + V_hydraulic² + V_random²)

V_mechanical = f(RPM, imbalance, bearing_condition, alignment)
V_hydraulic = f(flow_deviation_from_BEP, cavitation_margin)
V_random = Gaussian noise (σ = 0.1 mm/s)
```

### 6.5 Temperature Model
```
T_bearing = T_ambient + ΔT_load + ΔT_friction + ΔT_wear

Where:
  ΔT_load = k₁ × (Power / MaxPower)
  ΔT_friction = k₂ × (Vibration / BaselineVibration)
  ΔT_wear = k₃ × BearingWear%
```

### 6.6 Degradation Effects on Sensors

| Degradation | Affected Sensors |
|-------------|------------------|
| Impeller wear | ↑Power, ↓DischargePressure (for same flow) |
| Bearing wear | ↑Vibration, ↑BearingTemp |
| Seal wear | ↑SealChamberTemp |
| Cavitation | Noisy FlowRate, Noisy SuctionPressure |

---

## 7. Diurnal Flow Profile

When enabled, the simulation varies system demand following typical wastewater patterns.

### 7.1 Hourly Flow Multipliers
```
Hour  | Multiplier | Description
------|------------|-------------
00-05 | 0.5 - 0.7  | Low overnight flow
06-09 | 1.2 - 1.4  | Morning peak
10-11 | 0.9 - 1.0  | Mid-morning
12-14 | 1.0 - 1.2  | Lunch period
15-17 | 0.8 - 1.0  | Afternoon
18-21 | 1.1 - 1.3  | Evening peak
22-24 | 0.7 - 0.9  | Late evening
```

### 7.2 Flow Calculation
```
Demand = BaseFlow + (PeakFlow - BaseFlow) × Multiplier × RandomFactor

Where RandomFactor = 0.95 - 1.05 (±5% noise)
```

---

## 8. OPC-UA Methods

| Method Name | Parameters | Description |
|-------------|------------|-------------|
| `StartPump` | None | Issue start command |
| `StopPump` | None | Issue stop command |
| `SetSpeed` | TargetRPM (Double) | Set VFD speed setpoint |
| `SetMode` | Mode (String) | Change simulation mode |
| `TriggerFailure` | FailureType (String) | Initiate failure sequence |
| `ResetSimulation` | None | Reset to OPTIMAL mode, zero runtime |
| `ApplyAging` | Years (Double) | Instantly apply X years of wear |

---

## 9. Summary: What Analytics Systems Calculate

The following values are **NOT in OPC-UA** but can be calculated by consuming systems from raw sensor data:

| Calculated Value | Formula / Method |
|------------------|------------------|
| Total Head | (DischargePressure - SuctionPressure) × 10.2 + velocity head |
| Pump Efficiency | (ρ × g × Q × H) / (P × 1000) × 100 |
| Wire-to-Water Efficiency | Pump Efficiency × Motor Efficiency |
| Operating Point vs BEP | Compare current Q,H to design values |
| Pump Curve | Plot H vs Q at constant speed from historical data |
| Vibration Trend | Time-series analysis of vibration values |
| Health Score | ML model using vibration, temp, power signatures |
| Remaining Useful Life | Predictive model from degradation trends |
| Failure Probability | Statistical model from condition indicators |

---

## 10. Implementation Priority

### Phase 1: Core Sensor Simulation
1. Implement all raw sensor data points (Section 3)
2. Implement physics models for OPTIMAL mode
3. Add VFD speed control
4. Add runtime/start counters

### Phase 2: Aging & Degradation
1. Implement AGED mode with wear effects
2. Add DEGRADED mode with configurable wear
3. Ensure sensor values reflect degradation realistically

### Phase 3: Failure Simulation
1. Implement FAILURE mode framework
2. Add progressive sensor signature changes for each failure type
3. Add time-to-failure countdown

### Phase 4: Flow Profiles & Polish
1. Implement diurnal flow patterns
2. Add time acceleration for testing
3. Add wet well level simulation

---

## 11. Acceptance Criteria

- [ ] All 25+ sensor data points update at specified rates
- [ ] Flow range covers 10-30 MGD (1,600 - 4,700 m³/h)
- [ ] VFD speed control affects all sensor values per affinity laws
- [ ] OPTIMAL mode produces stable, nominal sensor values
- [ ] AGED mode shows realistic 5-year wear signatures
- [ ] DEGRADED mode responds to wear configuration
- [ ] FAILURE mode produces recognizable failure signatures
- [ ] Vibration correlates with speed and mechanical condition
- [ ] Temperatures correlate with load and wear
- [ ] Runtime hours accumulate correctly (with time acceleration)
- [ ] Diurnal pattern varies demand realistically
