"""WebSocket manager for streaming OPC-UA data to clients."""

import asyncio
import json
import logging
from datetime import datetime
from typing import Dict, Set, Any, Optional
from fastapi import WebSocket, WebSocketDisconnect

_logger = logging.getLogger('api.websocket')


class ConnectionManager:
    """Manages WebSocket connections and broadcasts pump data."""

    def __init__(self):
        self.active_connections: Set[WebSocket] = set()
        self.pump_data: Dict[str, Dict[str, Any]] = {}
        self._lock = asyncio.Lock()

    async def connect(self, websocket: WebSocket):
        """Accept a new WebSocket connection."""
        await websocket.accept()
        async with self._lock:
            self.active_connections.add(websocket)
        _logger.info(f"WebSocket client connected. Total: {len(self.active_connections)}")

        # Send current state immediately
        _logger.info(f"Sending initial state to new client. Pumps: {list(self.pump_data.keys())}")
        if self.pump_data:
            try:
                await websocket.send_json({
                    "type": "initial_state",
                    "data": self.pump_data,
                    "timestamp": datetime.utcnow().isoformat()
                })
            except Exception as e:
                _logger.warning(f"Failed to send initial state: {e}")

    async def disconnect(self, websocket: WebSocket):
        """Remove a WebSocket connection."""
        async with self._lock:
            self.active_connections.discard(websocket)
        _logger.info(f"WebSocket client disconnected. Total: {len(self.active_connections)}")

    async def broadcast(self, message: dict):
        """Broadcast a message to all connected clients."""
        if not self.active_connections:
            return

        dead_connections = set()
        async with self._lock:
            for connection in self.active_connections:
                try:
                    await connection.send_json(message)
                except Exception as e:
                    _logger.warning(f"Failed to send message to client: {e}")
                    dead_connections.add(connection)

            # Clean up dead connections
            for conn in dead_connections:
                self.active_connections.discard(conn)

    async def update_pump_data(self, pump_id: str, data: Dict[str, Any]):
        """Update pump data and broadcast to clients."""
        self.pump_data[pump_id] = {
            **data,
            "timestamp": datetime.utcnow().isoformat()
        }

        await self.broadcast({
            "type": "pump_update",
            "pump_id": pump_id,
            "data": self.pump_data[pump_id]
        })

    async def update_all_pumps(self, all_data: Dict[str, Dict[str, Any]]):
        """Update all pump data at once and broadcast."""
        timestamp = datetime.utcnow().isoformat()
        for pump_id, data in all_data.items():
            self.pump_data[pump_id] = {
                **data,
                "timestamp": timestamp
            }

        await self.broadcast({
            "type": "bulk_update",
            "data": self.pump_data,
            "timestamp": timestamp
        })

    async def broadcast_pubsub(self, topic: str, payload: Dict[str, Any]):
        """Broadcast a PubSub (MQTT-style) update to clients."""
        await self.broadcast({
            "type": "pubsub_update",
            "topic": topic,
            "payload": payload,
            "timestamp": datetime.utcnow().isoformat()
        })

    def get_pump_data(self, pump_id: str) -> Optional[Dict[str, Any]]:
        """Get current data for a specific pump."""
        return self.pump_data.get(pump_id)

    def get_all_pump_data(self) -> Dict[str, Dict[str, Any]]:
        """Get current data for all pumps."""
        return self.pump_data.copy()


# Global connection manager instance
ws_manager = ConnectionManager()
