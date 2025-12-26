# OPC-UA Pump Simulation Server Analysis

## 1. Overview
The OPC-UA Pump Simulation Server is a comprehensive solution for simulating wastewater treatment facility influent pump stations. It provides a realistic physics-based simulation of pumps, chambers, and sensors, accessible via a standard OPC-UA interface and a REST/WebSocket API.

## 2. Architecture

The server is built using Python and follows a modular architecture:

### 2.1 Entry Point (`server.py`)
- Initializes the `asyncua` Server.
- Loads configuration from SQLite database or YAML/JSON files.
- Sets up the OPC-UA address space using builders.
- Starts the `SimulationEngine`.
- Optionally starts the REST API and WebSocket server using `uvicorn`.

### 2.2 OPC-UA Layer (`opcua/`)
- **`TypeBuilder`**: Dynamically creates OPC-UA `ObjectTypes` from `types.yaml`. Supports complex types like `AnalogItemType`, `TwoStateDiscreteType`, and custom methods.
- **`AssetBuilder`**: Instantiates assets (Pumps, Chambers, Systems) from `assets.json` based on the defined types. It handles hierarchical relationships and property assignments.
- **`MethodHandlers`**: Binds OPC-UA methods (e.g., `StartPump`, `SetSpeed`) to Python simulation logic.
- **`AlarmManager`**: Configures and manages OPC-UA alarms and conditions.

### 2.3 Simulation Layer (`simulation/`)
- **`SimulationEngine`**: The core loop that coordinates all simulation instances. It manages global time, simulation modes (OPTIMAL, AGED, DEGRADED, FAILURE), and broadcasts state updates via WebSockets.
- **`PumpSimulation`**: Simulates a single centrifugal pump. It calculates 27 data points including:
    - **Hydraulic**: Flow Rate, Suction/Discharge Pressure.
    - **Electrical**: Voltage, Current, Power, Power Factor, VFD Frequency.
    - **Mechanical**: RPM, Vibration (6-axis).
    - **Thermal**: Motor Winding, Bearings, Seal Chamber temperatures.
    - **Status**: Run/Fault status, Runtime hours.
- **`Physics`**: Contains the physics equations for pump curves, efficiency, power, and wear degradation.

### 2.4 API Layer (`api/`)
- **REST API (`main.py`)**: Built with FastAPI. Provides endpoints for:
    - Server control (Start/Stop/Restart).
    - Simulation configuration (Mode, Speed, Failures).
    - Asset management (CRUD).
- **WebSockets (`websocket.py`)**: Streams real-time pump data to connected clients (e.g., web dashboards).

### 2.5 Data Persistence (`database/`)
- Uses SQLite to store configuration, asset definitions, and simulation run history.
- Allows the server state to persist across restarts.

## 3. Key Features

### 3.1 Simulation Modes
The server supports dynamic switching between simulation modes:
- **OPTIMAL**: Ideal operating conditions.
- **AGED**: Simulates wear over years of operation (reduced efficiency).
- **DEGRADED**: specific component wear (Impeller, Bearing, Seal).
- **FAILURE**: Simulates catastrophic failures (e.g., Cavitation, Motor Burnout).

### 3.2 Address Space
The OPC-UA address space is rich and structured:
- **Hierarchical**: Plant -> Process -> System -> Asset.
- **Typed**: Uses proper OPC-UA types (`AnalogItemType` with Engineering Units).
- **Interactive**: Writable variables and executable methods.

## 4. Verification Status

- [x] **OPC-UA Connectivity**: Client connects successfully to `opc.tcp://localhost:4840/freeopcua/server/`.
- [x] **Address Space Browsing**: Client can navigate to specific pump nodes (e.g., `Objects/RC_RockCreek/P0041_Preliminary/S00630_InfluentPumping/IPS_PMP_001`).
- [x] **Variable Monitoring**: Subscriptions to variables like `FlowRate`, `RPM`, `MotorCurrent` are working.
- [x] **Real-time Data**: Verified that data changes are received by the client when the pump is running.
- [x] **REST API**: Health check and basic endpoints verified.
- [x] **WebSocket Streaming**: Implemented a robust singleton WebSocket client in the dashboard. Resolved a "thundering herd" issue where multiple components were opening redundant connections.

### Bug Fixes
- **DataValue Initialization**: Fixed a bug where `DataValue` initialization was incorrect for `asyncua` 1.0.0, preventing data from being written to OPC-UA nodes. The fix involved using the `StatusCode_` keyword in the `DataValue` constructor and ensuring fields are set during initialization as they are immutable in this version.
- **WebSocket "Thundering Herd"**: Refactored the dashboard's WebSocket hook to use a singleton pattern stored on the `window` object. This prevents opening multiple redundant connections across different components and handles Next.js HMR/Strict Mode gracefully.
- **Pump Control**: Verified that starting the server with `--auto-start` correctly initializes pumps in a running state, allowing immediate data flow.

## 5. Conclusion
The OPC-UA Pump Simulation Server implementation is **correct and complete**. It successfully integrates a physics-based simulation with a standard OPC-UA server and a modern web API. It meets the requirements for client connectivity, browsing, monitoring, and control.
