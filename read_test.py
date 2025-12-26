"""Quick test to read values directly."""
import asyncio
from asyncua import Client

async def main():
    url = "opc.tcp://localhost:4840/freeopcua/server/"
    async with Client(url=url) as client:
        print(f"Connected to {url}")

        ns_idx = await client.get_namespace_index("http://cleanwaterservices.org/opcua")

        # Navigate to pump
        objects = client.nodes.objects
        rc = await objects.get_child(f"{ns_idx}:RC_RockCreek")
        p41 = await rc.get_child(f"{ns_idx}:P0041_Preliminary")
        s630 = await p41.get_child(f"{ns_idx}:S00630_InfluentPumping")
        pump = await s630.get_child(f"{ns_idx}:IPS_PMP_001")

        print(f"\nPump node: {pump}")

        # Read some values directly
        vars_to_read = ["FlowRate", "RPM", "RunCommand", "RunFeedback", "PowerConsumption"]

        for var_name in vars_to_read:
            try:
                node = await pump.get_child(f"{ns_idx}:{var_name}")
                val = await node.read_value()
                dv = await node.read_data_value()
                print(f"{var_name}: {val} (timestamp: {dv.SourceTimestamp})")
            except Exception as e:
                print(f"{var_name}: ERROR - {e}")

if __name__ == '__main__':
    asyncio.run(main())
