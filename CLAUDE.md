# OPC-UA Server Project

## Overview
Python-based OPC-UA server simulating a wastewater treatment facility influent pump (10-30 MGD capacity) using the `asyncua` library. Provides realistic data for predictive maintenance, efficiency analysis, and pump curve generation.

**See `SPECS.md` for detailed simulation specifications.**

## Tech Stack
- Python 3.x
- asyncua (OPC-UA implementation)
- PyYAML (configuration parsing)

## Project Structure
- `server.py` - Main server with simulation engine and equipment classes (PumpSim, ChamberSim)
- `client.py` - OPC-UA client for testing
- `types.yaml` - OPC-UA type definitions (ObjectTypes, Variables, Methods)
- `assets.json` - Equipment instances and hierarchy
- `address-space.yaml` - Address space configuration

## Running the Server
```bash
pip install -r requirements.txt
python server.py
```
Server endpoint: `opc.tcp://0.0.0.0:4840/freeopcua/server/`

## Key Concepts

### Simulation Engine
- Runs continuous tick loop updating equipment values
- Configurable interval via `SimulationConfig/SimulationInterval` node

### PumpType Simulation
- Realistic pump physics: RPM inertia, flow rates, pressure, efficiency
- Methods: `StartPump`, `StopPump`, `TriggerOverloadAlarm`
- Design specs: MaxRPM, DesignFlow, DesignHead, DesignPower

### ChamberType Simulation
- Simple level and temperature simulation with sine wave patterns

## Development Guidelines
- Types are defined in `types.yaml` - add new equipment types there
- Equipment instances go in `assets.json` with parent hierarchy
- Simulations are bound in `server.py` main() after asset instantiation
- Use EURange properties for value clamping
