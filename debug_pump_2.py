import asyncio
from asyncua import Client

async def main():
    url = "opc.tcp://localhost:4840/freeopcua/server/"
    async with Client(url=url) as client:
        ns_idx = await client.get_namespace_index("http://cleanwaterservices.org/opcua")
        objects = client.nodes.objects
        
        # Path to IPS_PMP_002
        path = ["2:RC_RockCreek", "2:P0041_Preliminary", "2:S00630_InfluentPumping", "2:IPS_PMP_002"]
        pump = await objects.get_child(path)
        print(f"Pump: {pump} ({pump.nodeid})")
        
        run_cmd = await pump.get_child(f"{ns_idx}:RunCommand")
        flow_rate = await pump.get_child(f"{ns_idx}:FlowRate")
        
        print(f"RunCommand: {run_cmd} ({run_cmd.nodeid}) Value: {await run_cmd.read_value()}")
        print(f"FlowRate: {flow_rate} ({flow_rate.nodeid}) Value: {await flow_rate.read_value()}")

if __name__ == "__main__":
    asyncio.run(main())
