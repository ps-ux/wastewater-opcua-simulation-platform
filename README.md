# Wastewater Influent Pump OPC-UA Simulation Platform

A realistic simulation platform for wastewater treatment facility influent pumps (10-30 MGD). This platform simulates raw sensor data via an OPC-UA server, enabling analytics platforms to perform efficiency calculations, predictive maintenance, and failure analysis.

## Overview

The simulation handles complex hydraulic and mechanical physics to provide realistic data points, including:
- Flow rates, suction and discharge pressures.
- VFD and motor electrical data (RPM, Current, Voltage, Power).
- Temperature and vibration measurements (Motor winding, Bearings, Seal chamber).
- Runtime counters and discrete status indicators.

## Features

- **Multiple Simulation Modes:**
  - `OPTIMAL`: New pump performance.
  - `AGED`: Typical 5-year wear signatures.
  - `DEGRADED`: Configurable wear (Impeller, Bearing, Seal).
  - `FAILURE`: Progressive failure signatures (Bearing, Seal, Cavitation, etc.).
- **Diurnal Flow Profiles:** Realistic daily demand patterns.
- **OPC-UA Methods:** Start/Stop controls, Speed setpoints, and Mode transitions.
- **Physics-Based Models:** Accurate affinity laws, head-flow relationships, and degradation effects.

## Getting Started

### Prerequisites
- Python 3.x
- OPC-UA client/server libraries

### Installation
1. Clone the repository.
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

### Running the Server
Start the OPC-UA simulation server:
```bash
python server.py
```

## Documentation
- `SPECS.md`: Detailed technical specifications and data point mapping.
- `analysis.md`: Analysis of simulation behavior and models.

## Repository Structure
- `api/`: API endpoints and WebSocket handlers.
- `config/`: Configuration files for the simulation.
- `database/`: Database storage for historical trends.
- `opcua/`: OPC-UA server implementation and node definitions.
- `simulation/`: Underlying physics and simulation engine.
- `ui/`: Dashboard and visualization components.
