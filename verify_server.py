
import asyncio
import logging
import sys
import aiohttp
from asyncua import Client

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("verify_server")

OPC_URL = "opc.tcp://localhost:4840/freeopcua/server/"
API_URL = "http://localhost:8080/api/health"

async def verify_opcua():
    logger.info(f"Connecting to OPC UA server at {OPC_URL}...")
    try:
        async with Client(url=OPC_URL) as client:
            logger.info("Connected to OPC UA Server")
            
            # Browse Root
            root = client.nodes.root
            logger.info("Browsing Root...")
            objects = await root.get_child(["0:Objects"])
            children = await objects.get_children()
            logger.info(f"Found {len(children)} objects in Objects folder")
            
            # Recursive search for a pump
            async def find_pump(node, depth=0):
                if depth > 3: return None
                try:
                    children = await node.get_children()
                    for child in children:
                        bn = await child.read_browse_name()
                        # Check if it has FlowRate
                        try:
                            await child.get_child(["FlowRate"])
                            return child
                        except:
                            pass
                        
                        # Recurse
                        found = await find_pump(child, depth + 1)
                        if found: return found
                except:
                    pass
                return None

            logger.info("Searching for pump recursively...")
            pump_node = await find_pump(objects)
            
            if not pump_node:
                logger.warning("No pump found with FlowRate variable after recursive search")
                # Print top level objects to debug
                for child in await objects.get_children():
                    bn = await child.read_browse_name()
                    logger.info(f"Top level object: {bn.Name}")
                return False

            bn = await pump_node.read_browse_name()
            logger.info(f"Found Pump: {bn.Name}")

            # Read FlowRate
            flow_node = await pump_node.get_child(["FlowRate"])
            val = await flow_node.read_value()
            logger.info(f"Read FlowRate: {val}")
            
            # Call SetSpeed method
            # Method is 'SetSpeed' on the pump object
            try:
                method_node = await pump_node.get_child(["SetSpeed"])
                logger.info("Found SetSpeed method")
                # Call it
                res = await pump_node.call_method(method_node, 900.0)
                logger.info(f"Called SetSpeed(900.0), result: {res}")
            except Exception as e:
                logger.warning(f"Failed to call SetSpeed: {e}")

            return True
    except Exception as e:
        logger.error(f"OPC UA Verification failed: {e}")
        return False

async def verify_api():
    logger.info(f"Checking REST API at {API_URL}...")
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(API_URL) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    logger.info(f"API Health: {data}")
                    return True
                else:
                    logger.error(f"API returned status {resp.status}")
                    return False
    except Exception as e:
        logger.error(f"API Verification failed: {e}")
        return False

async def main():
    opcua_ok = await verify_opcua()
    api_ok = await verify_api()
    
    if opcua_ok and api_ok:
        logger.info("VERIFICATION SUCCESSFUL")
        sys.exit(0)
    else:
        logger.error("VERIFICATION FAILED")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())
