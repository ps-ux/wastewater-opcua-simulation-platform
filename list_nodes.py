import asyncio
from asyncua import Client

async def main():
    url = "opc.tcp://localhost:4840/freeopcua/server/"
    async with Client(url=url) as client:
        ns_idx = await client.get_namespace_index("http://cleanwaterservices.org/opcua")
        objects = client.nodes.objects
        
        # Path to IPS_PMP_001
        path = ["2:RC_RockCreek", "2:P0041_Preliminary", "2:S00630_InfluentPumping", "2:IPS_PMP_001"]
        pump = await objects.get_child(path)
        
        async def list_recursive(node, depth=0):
            bn = await node.read_browse_name()
            print("  " * depth + f"{bn.Name} ({node.nodeid})")
            children = await node.get_children()
            for child in children:
                await list_recursive(child, depth + 1)

        print(f"Pump: {pump} ({pump.nodeid})")
        await list_recursive(pump)

if __name__ == "__main__":
    asyncio.run(main())
