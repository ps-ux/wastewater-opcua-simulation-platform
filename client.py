"""OPC-UA Client for monitoring pump data.

Subscribes to IPS_PMP_001 and displays real-time sensor values.
Run the server with --auto-start to have pumps running.

Usage:
    python client.py
"""

import asyncio
import logging
from datetime import datetime
from asyncua import Client

# Configure logging
logging.basicConfig(level=logging.WARNING)
_logger = logging.getLogger('opcua_client')
_logger.setLevel(logging.INFO)


class PumpDataHandler:
    """Handles data change notifications from OPC-UA subscriptions."""

    def __init__(self, node_map: dict):
        self.node_map = node_map
        self.last_values = {}

    def datachange_notification(self, node, val, data):
        """Called when a subscribed value changes."""
        nid = node.nodeid.Identifier
        name = self.node_map.get(nid, str(nid))

        # Store and format value
        self.last_values[name] = val

        if isinstance(val, float):
            val_str = f"{val:>10.2f}"
        elif isinstance(val, bool):
            val_str = f"{'ON' if val else 'OFF':>10}"
        else:
            val_str = f"{val!s:>10}"

        # Get timestamp
        timestamp = datetime.now().strftime("%H:%M:%S")

        print(f"[{timestamp}] {name:<20} {val_str}")


async def main():
    url = "opc.tcp://localhost:4840/freeopcua/server/"

    print("=" * 60)
    print("OPC-UA Pump Data Monitor")
    print("=" * 60)
    print(f"Connecting to: {url}")
    print()

    async with Client(url=url) as client:
        _logger.info(f"Connected to {url}")

        # Get namespace index
        ns_idx = await client.get_namespace_index("http://cleanwaterservices.org/opcua")

        # Helper to navigate to child node
        async def get_node(parent, name):
            try:
                return await parent.get_child(f"{ns_idx}:{name}")
            except Exception:
                children = await parent.get_children()
                child_names = [(await c.read_browse_name()).Name for c in children]
                _logger.error(f"Node '{name}' not found. Available: {child_names}")
                raise

        # Navigate to pump IPS_PMP_001
        objects = client.nodes.objects
        rc = await get_node(objects, "RC_RockCreek")
        p41 = await get_node(rc, "P0041_Preliminary")
        s630 = await get_node(p41, "S00630_InfluentPumping")
        pump = await get_node(s630, "IPS_PMP_001")

        print(f"Connected to pump: IPS_PMP_001")
        print(f"Node ID: {pump.nodeid}")
        print()

        # Read static properties
        print("--- Design Specifications ---")
        try:
            specs = await get_node(pump, "DesignSpecs")
            design_flow = await (await get_node(specs, "DesignFlow")).read_value()
            max_rpm = await (await get_node(specs, "MaxRPM")).read_value()
            design_head = await (await get_node(specs, "DesignHead")).read_value()
            design_power = await (await get_node(specs, "DesignPower")).read_value()

            print(f"  Design Flow:  {design_flow} m³/h")
            print(f"  Max RPM:      {max_rpm}")
            print(f"  Design Head:  {design_head} m")
            print(f"  Design Power: {design_power} kW")
        except Exception as e:
            print(f"  Could not read specs: {e}")
        print()

        # Check current run status
        try:
            run_cmd = await get_node(pump, "RunCommand")
            is_running = await run_cmd.read_value()
            print(f"Pump Status: {'RUNNING' if is_running else 'STOPPED'}")
            if not is_running:
                print("  (Start server with --auto-start to run pumps)")
        except Exception as e:
            print(f"Could not read status: {e}")
        print()

        # Variables to monitor
        variables_to_monitor = [
            # Flow & Pressure
            "FlowRate",
            "SuctionPressure",
            "DischargePressure",
            # VFD/Electrical
            "RPM",
            "MotorCurrent",
            "PowerConsumption",
            "VFDFrequency",
            # Temperature
            "MotorWindingTemp",
            "BearingTemp_DE",
            "BearingTemp_NDE",
            # Vibration
            "Vibration_DE_H",
            "Vibration_DE_V",
        ]

        # Create subscription
        node_map = {}
        handler = PumpDataHandler(node_map)

        # 500ms publishing interval
        sub = await client.create_subscription(500, handler)

        # First, read current values directly to verify they exist
        print("--- Current Values (direct read) ---")
        for var_name in variables_to_monitor:
            try:
                node = await get_node(pump, var_name)
                val = await node.read_value()
                print(f"  {var_name}: {val}")
            except Exception as e:
                print(f"  {var_name}: ERROR - {e}")
        print()

        print("--- Subscribing to Variables ---")
        subscribed_count = 0
        for var_name in variables_to_monitor:
            try:
                node = await get_node(pump, var_name)
                nid = node.nodeid.Identifier
                node_map[nid] = var_name
                await sub.subscribe_data_change(node)
                subscribed_count += 1
            except Exception as e:
                print(f"  Could not subscribe to {var_name}: {e}")

        print(f"Subscribed to {subscribed_count} variables")
        print()
        print("--- Live Data (Press Ctrl+C to stop) ---")
        print(f"{'Time':<10} {'Variable':<20} {'Value':>10}")
        print("-" * 42)

        try:
            # Run until interrupted
            while True:
                await asyncio.sleep(1)
        except asyncio.CancelledError:
            pass
        finally:
            print()
            print("--- Disconnecting ---")


if __name__ == '__main__':
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nStopped by user")
    except Exception as e:
        print(f"Error: {e}")
