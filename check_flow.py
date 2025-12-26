import asyncio
from asyncua import Client, ua

async def main():
    url = "opc.tcp://localhost:4840/freeopcua/server/"
    async with Client(url=url) as client:
        ns_idx = await client.get_namespace_index("http://cleanwaterservices.org/opcua")
        objects = client.nodes.objects
        
        # Path to IPS_PMP_001
        path = ["2:RC_RockCreek", "2:P0041_Preliminary", "2:S00630_InfluentPumping", "2:IPS_PMP_001"]
        pump = await objects.get_child(path)
        
        flow_rate = await pump.get_child(f"{ns_idx}:FlowRate")
        dv = await flow_rate.read_data_value()
        
        print(f"FlowRate Value: {dv.Value.Value}")
        print(f"SourceTimestamp: {dv.SourceTimestamp}")
        print(f"ServerTimestamp: {dv.ServerTimestamp}")
        print(f"StatusCode: {dv.StatusCode}")

if __name__ == "__main__":
    asyncio.run(main())
