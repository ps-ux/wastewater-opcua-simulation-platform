import asyncio
import json
import logging
from typing import Dict, Any
import paho.mqtt.client as mqtt
from amqtt.broker import Broker

_logger = logging.getLogger('pubsub_manager')

class PubSubManager:
    """Manages the internal MQTT broker and publishing of simulation data."""
    
    def __init__(self, host: str = '0.0.0.0', port: int = 1883):
        self.host = host
        self.port = port
        self.broker = None
        self.client = None
        self.is_running = False
        self._publish_queue = asyncio.Queue()
        self._worker_task = None
        
        # Broker configuration
        self.broker_config = {
            'listeners': {
                'default': {
                    'type': 'tcp',
                    'bind': f'{host}:{port}',
                }
            },
            'sys_interval': 10,
            'auth': {
                'allow-anonymous': True,
            }
        }

    async def start(self):
        """Start the internal MQTT broker and the publisher client."""
        if self.is_running:
            return

        try:
            # Start Broker
            self.broker = Broker(self.broker_config)
            await self.broker.start()
            _logger.info(f"MQTT Broker started on {self.host}:{self.port}")
            
            # Start Publisher Client
            self.client = mqtt.Client(client_id="PumpSimPublisher", protocol=mqtt.MQTTv311)
            self.client.connect("127.0.0.1", self.port, 60)
            self.client.loop_start()
            
            self.is_running = True
            self._worker_task = asyncio.create_task(self._publish_worker())
            _logger.info("MQTT Publisher client connected and worker started")
            
        except Exception as e:
            _logger.error(f"Failed to start PubSub Manager: {e}")
            raise

    async def stop(self):
        """Stop the broker and client."""
        self.is_running = False
        if self._worker_task:
            self._worker_task.cancel()
        
        if self.client:
            self.client.loop_stop()
            self.client.disconnect()
            
        if self.broker:
            await self.broker.shutdown()
        
        _logger.info("PubSub Manager stopped")

    async def _publish_worker(self):
        """Background worker to process the publish queue."""
        while self.is_running:
            try:
                topic, payload = await self._publish_queue.get()
                self.client.publish(topic, json.dumps(payload), qos=1)
                self._publish_queue.task_done()
            except asyncio.CancelledError:
                break
            except Exception as e:
                _logger.error(f"Error in publish worker: {e}")
                await asyncio.sleep(1)

    def publish_pump_telemetry(self, pump_id: str, data: Dict[str, Any]):
        """Queue pump telemetry for publication."""
        if not self.is_running:
            return
            
        topic = f"plant/pumps/{pump_id}/telemetry"
        # Simplify data for MQTT (remove complex objects if any)
        message = {
            "timestamp": data.get("timestamp"),
            "pump_id": pump_id,
            "metrics": {
                "flow_rate": data.get("flow_rate"),
                "discharge_pressure": data.get("discharge_pressure"),
                "rpm": data.get("rpm"),
                "power_consumption": data.get("power_consumption"),
                "efficiency": data.get("efficiency"),
                "motor_temp": data.get("motor_temp")
            },
            "state": {
                "is_running": data.get("is_running"),
                "mode": data.get("mode"),
                "fault": data.get("fault")
            }
        }
        self._publish_queue.put_nowait((topic, message))

    def publish_event(self, event_type: str, details: Dict[str, Any]):
        """Queue a system event for publication."""
        if not self.is_running:
            return
            
        topic = f"plant/events/{event_type}"
        self._publish_queue.put_nowait((topic, details))
