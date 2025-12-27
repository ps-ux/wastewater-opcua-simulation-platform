"""OPC-UA Pump Simulation Server.

Simulates a wastewater treatment facility influent pump station with:
- Multiple pump types (PumpType, InfluentPumpType)
- 27 sensor data points per pump with realistic physics
- 4 simulation modes (OPTIMAL, AGED, DEGRADED, FAILURE)
- Diurnal flow patterns
- Full OPC-UA information model with AnalogItemType, TwoStateDiscreteType
- SQLite database for persistence
- REST API for configuration and control

Usage:
    python server.py              # Run OPC-UA server only
    python server.py --with-api   # Run OPC-UA server with REST API

Server endpoint: opc.tcp://0.0.0.0:4840/freeopcua/server/
API endpoint: http://0.0.0.0:8080
"""

import argparse
import asyncio
import logging
import signal
import sys
from pathlib import Path
from typing import Optional

# Add project root to path for imports
sys.path.insert(0, str(Path(__file__).parent))

from asyncua import Server

from config.loader import ConfigLoader
from database.manager import DatabaseManager
from opcua.type_builder import TypeBuilder
from opcua.asset_builder import AssetBuilder
from opcua.method_handlers import MethodHandlers
from opcua.alarms import AlarmManager, LimitAlarmConfig, PumpAlarmMonitor
from simulation.engine import SimulationEngine
from simulation.pump import PumpSimulation
from simulation.chamber import ChamberSimulation
from simulation.modes import ModeParameters, SimulationMode, FailureType
from simulation.pubsub import PubSubManager

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
_logger = logging.getLogger('opcua_server')

# Global references for signal handling
shutdown_event: Optional[asyncio.Event] = None
db_manager: Optional[DatabaseManager] = None


def parse_args():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(description='OPC-UA Pump Simulation Server')
    parser.add_argument('--with-api', action='store_true',
                        help='Start REST API server alongside OPC-UA')
    parser.add_argument('--api-port', type=int, default=8080,
                        help='REST API port (default: 8080)')
    parser.add_argument('--opcua-port', type=int, default=4840,
                        help='OPC-UA port (default: 4840)')
    parser.add_argument('--db-path', type=str, default='config/server.db',
                        help='SQLite database path')
    parser.add_argument('--use-db', action='store_true',
                        help='Load configuration from database instead of files')
    parser.add_argument('--auto-start', action='store_true',
                        help='Automatically start all pumps when server starts')
    parser.add_argument('--debug', action='store_true',
                        help='Enable debug logging')
    return parser.parse_args()


def load_mode_params_from_db(db: DatabaseManager) -> ModeParameters:
    """Load simulation mode parameters from database."""
    state = db.get_server_state()

    params = ModeParameters()

    # Set mode
    mode_map = {
        'OPTIMAL': SimulationMode.OPTIMAL,
        'AGED': SimulationMode.AGED,
        'DEGRADED': SimulationMode.DEGRADED,
        'FAILURE': SimulationMode.FAILURE
    }
    params.mode = mode_map.get(state.get('simulation_mode', 'OPTIMAL'), SimulationMode.OPTIMAL)

    # Set interval and time acceleration
    params.simulation_interval = state.get('simulation_interval_ms', 1000.0)
    params.time_acceleration = state.get('time_acceleration', 1.0)

    # Set aged config
    aged = state.get('aged_config', {})
    params.aged_config.years_of_operation = aged.get('years', 5.0)
    params.aged_config.average_run_hours_per_year = aged.get('hours_per_year', 6000.0)
    params.aged_config.start_cycles_per_year = aged.get('starts_per_year', 500)

    # Set degraded config
    degraded = state.get('degraded_config', {})
    params.degraded_config.impeller_wear = degraded.get('impeller_wear', 15.0)
    params.degraded_config.bearing_wear = degraded.get('bearing_wear', 20.0)
    params.degraded_config.seal_wear = degraded.get('seal_wear', 25.0)

    # Set failure config
    failure = state.get('failure_config', {})
    failure_type_map = {
        'NONE': FailureType.NONE,
        'BEARING': FailureType.BEARING,
        'SEAL': FailureType.SEAL,
        'CAVITATION': FailureType.CAVITATION,
        'IMPELLER': FailureType.IMPELLER,
        'MOTOR': FailureType.MOTOR
    }
    params.failure_config.failure_type = failure_type_map.get(
        failure.get('type', 'NONE'), FailureType.NONE
    )
    params.failure_config.failure_progression = failure.get('progression', 0.0)
    params.failure_config.time_to_failure = failure.get('time_to_failure', 100.0)

    # Set flow profile
    flow = state.get('flow_profile', {})
    params.flow_profile.diurnal_enabled = state.get('diurnal_enabled', True)
    params.flow_profile.base_flow = flow.get('base', 1600.0)
    params.flow_profile.peak_flow = flow.get('peak', 4000.0)
    params.flow_profile.peak_hour_1 = flow.get('peak_hour_1', 7)
    params.flow_profile.peak_hour_2 = flow.get('peak_hour_2', 19)

    return params


async def setup_alarms(alarm_manager: AlarmManager, config: ConfigLoader,
                        pump_sims: dict, pump_nodes: dict) -> None:
    """Setup alarms for all pumps."""
    alarm_defs = config.get_alarm_types()

    for pump_id, pump_sim in pump_sims.items():
        pump_node_map = pump_sim.nodes

        # Create alarm monitor for this pump
        monitor = PumpAlarmMonitor(alarm_manager, pump_id)

        # High Vibration Alarm
        if 'HighVibrationAlarm' in alarm_defs:
            alarm_def = alarm_defs['HighVibrationAlarm']
            monitor.register_alarm('Vibration_DE_H', LimitAlarmConfig(
                name='HighVibration',
                description=alarm_def.description,
                severity=alarm_def.severity,
                input_node_path='Vibration_DE_H',
                high_high_limit=alarm_def.high_high_limit,
                high_limit=alarm_def.high_limit,
                message=alarm_def.message
            ))

        # High Bearing Temp Alarm
        if 'HighBearingTempAlarm' in alarm_defs:
            alarm_def = alarm_defs['HighBearingTempAlarm']
            monitor.register_alarm('BearingTemp_DE', LimitAlarmConfig(
                name='HighBearingTemp',
                description=alarm_def.description,
                severity=alarm_def.severity,
                input_node_path='BearingTemp_DE',
                high_high_limit=alarm_def.high_high_limit,
                high_limit=alarm_def.high_limit,
                message=alarm_def.message
            ))

        # Overload Alarm
        if 'OverloadAlarm' in alarm_defs:
            alarm_def = alarm_defs['OverloadAlarm']
            monitor.register_alarm('MotorCurrent', LimitAlarmConfig(
                name='Overload',
                description=alarm_def.description,
                severity=alarm_def.severity,
                input_node_path='MotorCurrent',
                high_high_limit=alarm_def.high_high_limit,
                high_limit=alarm_def.high_limit,
                message=alarm_def.message
            ))

        # Cavitation Alarm
        if 'CavitationAlarm' in alarm_defs:
            alarm_def = alarm_defs['CavitationAlarm']
            monitor.register_alarm('SuctionPressure', LimitAlarmConfig(
                name='Cavitation',
                description=alarm_def.description,
                severity=alarm_def.severity,
                input_node_path='SuctionPressure',
                low_limit=alarm_def.low_limit,
                low_low_limit=alarm_def.low_low_limit,
                message=alarm_def.message
            ))

        # Store monitor with pump sim for tick checking
        pump_sim.alarm_monitor = monitor

    _logger.info(f"Configured alarms for {len(pump_sims)} pumps")


async def main():
    """Main server entry point."""
    global shutdown_event, db_manager

    args = parse_args()

    if args.debug:
        logging.getLogger().setLevel(logging.DEBUG)

    _logger.info("Starting OPC-UA Pump Simulation Server...")

    # Initialize database
    db_manager = DatabaseManager(args.db_path)
    db_manager.initialize()
    _logger.info(f"Database initialized: {args.db_path}")

    # Create shutdown event
    shutdown_event = asyncio.Event()

    # Initialize server
    server = Server()
    await server.init()

    # Support both URL formats for client compatibility
    endpoint = f"opc.tcp://0.0.0.0:{args.opcua_port}/freeopcua/server/"
    #endpoint_simple = f"opc.tcp://0.0.0.0:{args.opcua_port}/"

    # Set primary endpoint and add alternate
    server.set_endpoint(endpoint)

    # # Register both endpoints so clients can connect with either URL
    # from asyncua.ua import EndpointDescription, MessageSecurityMode, SecurityPolicy
    # endpoints = server.bserver.get_endpoints()
    # for ep in endpoints:
    #     # Create alternate endpoint with simple URL
    #     alt_ep = EndpointDescription()
    #     alt_ep.EndpointUrl = endpoint_simple
    #     alt_ep.Server = ep.Server
    #     alt_ep.ServerCertificate = ep.ServerCertificate
    #     alt_ep.SecurityMode = ep.SecurityMode
    #     alt_ep.SecurityPolicyUri = ep.SecurityPolicyUri
    #     alt_ep.UserIdentityTokens = ep.UserIdentityTokens
    #     alt_ep.TransportProfileUri = ep.TransportProfileUri
    #     alt_ep.SecurityLevel = ep.SecurityLevel
    #     server.bserver.add_endpoint(alt_ep)

    server.set_server_name("Pump Simulation Server")
    #endpoint = endpoint_with_path  # For logging

    # Load configuration (from files or database)
    config = ConfigLoader()

    if args.use_db:
        # Load mode params from database
        mode_params = load_mode_params_from_db(db_manager)
        _logger.info("Loaded configuration from database")
    else:
        mode_params = ModeParameters()
        _logger.info("Loaded configuration from types.yaml and assets.json")

    # Build OPC-UA types
    type_builder = TypeBuilder(server, config)
    idx = await type_builder.initialize()
    type_nodes = await type_builder.build_all_types()
    _logger.info(f"Built {len(type_nodes)} ObjectTypes")

    # Build asset instances
    asset_builder = AssetBuilder(server, config, type_nodes, idx)
    node_map = await asset_builder.build_all_assets()
    _logger.info(f"Built {len(node_map)} assets")

    # Initialize simulation engine
    engine = SimulationEngine(mode_params)
    
    # Initialize PubSub Manager (Secondary OT Communication)
    pubsub_manager = PubSubManager(host='0.0.0.0', port=1883)
    try:
        await pubsub_manager.start()
        engine.set_pubsub_manager(pubsub_manager)
    except Exception as e:
        _logger.error(f"Could not start MQTT PubSub: {e}")
        _logger.info("Continuing without MQTT PubSub support")

    # Initialize alarm manager
    alarm_manager = AlarmManager(server, idx)
    await alarm_manager.configure_from_yaml(
        {name: alarm.__dict__ for name, alarm in config.get_alarm_types().items()},
        node_map
    )

    # Bind simulations to assets
    simulation_targets = asset_builder.get_simulation_targets()
    pump_sims = {}

    for target in simulation_targets:
        asset_type = target['type']
        asset_id = target['id']
        asset_name = target['name']
        asset_node = target['node']
        design_specs = target['design_specs']

        if asset_type in ('PumpType', 'InfluentPumpType'):
            pump_sim = PumpSimulation(
                asset_id=asset_id,
                name=asset_name,
                node=asset_node,
                design_specs=design_specs,
                server=server,
                mode_params=mode_params
            )
            await pump_sim.bind()
            engine.add_pump(pump_sim)
            pump_sims[asset_id] = pump_sim
            _logger.debug(f"Bound pump simulation: {asset_name}")

        elif asset_type == 'ChamberType':
            chamber_sim = ChamberSimulation(
                asset_id=asset_id,
                name=asset_name,
                node=asset_node,
                server=server,
                mode_params=mode_params
            )
            await chamber_sim.bind()
            engine.add_chamber(chamber_sim)
            _logger.debug(f"Bound chamber simulation: {asset_name}")

    _logger.info(f"Bound simulations to {len(simulation_targets)} assets")

    # Auto-start pumps if requested
    if args.auto_start:
        for pump_id, pump_sim in pump_sims.items():
            await pump_sim.start()
            _logger.info(f"Auto-started pump: {pump_sim.name}")
        _logger.info(f"Auto-started {len(pump_sims)} pumps")

    # Setup alarms for pumps
    await setup_alarms(alarm_manager, config, pump_sims, node_map)

    # Bind simulation config methods
    sim_config_node = node_map.get('SimConfig')
    if sim_config_node:
        method_handlers = MethodHandlers(server, engine, node_map)
        await method_handlers.bind_simulation_config_methods(sim_config_node)
        await method_handlers.setup_config_subscriptions(sim_config_node)
        _logger.info("Bound SimulationConfig methods")

    # Update database with running state
    db_manager.set_server_running()
    run_id = db_manager.start_simulation_run(
        mode=mode_params.mode.name,
        notes="Server started"
    )

    # Start REST API if requested
    api_task = None
    if args.with_api:
        import uvicorn
        from api.main import app, db as api_db
        from api.websocket import ws_manager
        from api.engine_bridge import register_engine

        # Register engine for API access (enables pump start/stop/speed control)
        register_engine(engine)
        _logger.info("Simulation engine registered for API control")

        # Wire up WebSocket broadcast callback
        async def ws_broadcast(all_states):
            await ws_manager.update_all_pumps(all_states)
            
            # Also simulate PubSub flow by broadcasting MQTT-style packets
            for pump_id, state in all_states.items():
                # Telemetry Topic
                telemetry_topic = f"plant/pumps/{pump_id}/telemetry"
                telemetry_payload = {
                    "metrics": {
                        "flow_rate": state.get('flow_rate'),
                        "discharge_pressure": state.get('discharge_pressure'),
                        "suction_pressure": state.get('suction_pressure'),
                        "rpm": state.get('rpm'),
                        "power_consumption": state.get('power_consumption'),
                        "efficiency": state.get('efficiency'),
                        "motor_temp": state.get('motor_temp'),
                        "vibration_level": state.get('vibration_de_h')
                    },
                    "state": {
                        "is_running": state.get('is_running'),
                        "is_faulted": state.get('is_faulted'),
                        "mode": state.get('mode')
                    }
                }
                await ws_manager.broadcast_pubsub(telemetry_topic, telemetry_payload)

                # Maintenance/Lifecycle Topic (published less frequently or on change)
                if state.get('runtime_hours', 0) % 10 < 1: # Pseudo-frequency
                    maint_topic = f"plant/pumps/{pump_id}/maintenance"
                    maint_payload = {
                        "runtime_hours": state.get('runtime_hours'),
                        "start_count": state.get('start_count'),
                        "last_start": state.get('timestamp')
                    }
                    await ws_manager.broadcast_pubsub(maint_topic, maint_payload)

            # System Analytics Topic
            avg_efficiency = sum(p.get('efficiency', 0) for p in all_states.values()) / len(all_states) if all_states else 0
            analytics_topic = "plant/system/analytics"
            analytics_payload = {
                "system_efficiency": avg_efficiency,
                "active_pumps": len([p for p in all_states.values() if p.get('is_running')]),
                "total_flow": sum(p.get('flow_rate', 0) for p in all_states.values())
            }
            await ws_manager.broadcast_pubsub(analytics_topic, analytics_payload)

        engine.set_ws_broadcast_callback(ws_broadcast)
        _logger.info("WebSocket broadcast callback registered")

        # Share database manager
        api_config = uvicorn.Config(
            app,
            host="0.0.0.0",
            port=args.api_port,
            log_level="info"
        )
        api_server = uvicorn.Server(api_config)
        api_task = asyncio.create_task(api_server.serve())
        _logger.info(f"REST API starting on http://0.0.0.0:{args.api_port}")

    # Start server
    _logger.info("Starting OPC-UA server...")
    async with server:
        _logger.info("=" * 60)
        _logger.info("OPC-UA Pump Simulation Server is running")
        _logger.info(f"OPC-UA Endpoint: {endpoint}")
        if args.with_api:
            _logger.info(f"REST API: http://0.0.0.0:{args.api_port}")
            _logger.info(f"API Docs: http://0.0.0.0:{args.api_port}/docs")
            _logger.info(f"WebSocket: ws://0.0.0.0:{args.api_port}/ws/pumps")
        _logger.info(f"Simulating {len(engine.pumps)} pumps and {len(engine.chambers)} chambers")
        _logger.info(f"Simulation Mode: {mode_params.mode.name}")
        _logger.info("Press Ctrl+C to stop")
        _logger.info("=" * 60)

        try:
            # Run simulation engine
            await engine.run()
        except asyncio.CancelledError:
            _logger.info("Simulation engine cancelled")

    # Cleanup
    if api_task:
        api_task.cancel()

    # Stop PubSub Manager
    if pubsub_manager:
        await pubsub_manager.stop()

    # Update database
    total_runtime = sum(p.runtime_hours for p in engine.pumps.values())
    total_starts = sum(p.start_count for p in engine.pumps.values())
    db_manager.end_simulation_run(run_id, total_runtime, total_starts)
    db_manager.set_server_stopped()
    db_manager.close()


def handle_signal(sig):
    """Handle shutdown signals."""
    _logger.info(f"Received signal {sig}, shutting down...")
    if shutdown_event:
        shutdown_event.set()


if __name__ == '__main__':
    # Setup signal handlers
    if sys.platform != 'win32':
        loop = asyncio.new_event_loop()
        for sig in (signal.SIGTERM, signal.SIGINT):
            loop.add_signal_handler(sig, lambda s=sig: handle_signal(s))

    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        _logger.info("Server stopped by user")
    except Exception as e:
        _logger.error(f"Server error: {e}")
        if db_manager:
            db_manager.set_server_stopped(error=str(e))
            db_manager.close()
        raise
