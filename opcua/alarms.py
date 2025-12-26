"""OPC-UA Alarm implementation.

Implements LimitAlarmType for pump monitoring including:
- High/HighHigh/Low/LowLow limit checking
- Alarm state management
- Severity and condition handling
"""

import logging
from datetime import datetime
from typing import Dict, Any, Optional, List
from dataclasses import dataclass, field
from enum import IntEnum
from asyncua import ua

_logger = logging.getLogger('opcua.alarms')


class AlarmSeverity(IntEnum):
    """OPC-UA alarm severity levels (0-1000)."""
    INFO = 100
    LOW = 300
    MEDIUM = 500
    HIGH = 700
    URGENT = 900
    CRITICAL = 1000


class AlarmState(IntEnum):
    """Alarm state enumeration."""
    NORMAL = 0
    LOW = 1
    LOW_LOW = 2
    HIGH = 3
    HIGH_HIGH = 4


@dataclass
class LimitAlarmConfig:
    """Configuration for a limit alarm."""
    name: str
    description: str = ""
    severity: int = 500
    input_node_path: str = ""

    # Limits (None means not configured)
    high_high_limit: Optional[float] = None
    high_limit: Optional[float] = None
    low_limit: Optional[float] = None
    low_low_limit: Optional[float] = None

    # Hysteresis to prevent alarm chatter
    hysteresis: float = 0.0

    # Message template
    message: str = ""

    # Current state
    state: AlarmState = AlarmState.NORMAL
    is_active: bool = False
    acknowledged: bool = True
    last_value: float = 0.0
    activated_at: Optional[datetime] = None


@dataclass
class AlarmEvent:
    """Alarm event for history/notification."""
    alarm_name: str
    state: AlarmState
    value: float
    limit: float
    severity: int
    message: str
    timestamp: datetime
    source_node: str
    acknowledged: bool = False


class AlarmManager:
    """Manages OPC-UA alarms for the server."""

    def __init__(self, server: Any, idx: int):
        self.server = server
        self.idx = idx
        self.alarms: Dict[str, LimitAlarmConfig] = {}
        self.alarm_nodes: Dict[str, Any] = {}
        self.input_nodes: Dict[str, Any] = {}
        self.event_history: List[AlarmEvent] = []
        self.max_history = 1000

    async def configure_alarm(self, config: LimitAlarmConfig, input_node: Any) -> None:
        """Configure a limit alarm."""
        self.alarms[config.name] = config
        self.input_nodes[config.name] = input_node
        _logger.debug(f"Configured alarm: {config.name}")

    async def configure_from_yaml(self, alarm_defs: Dict[str, Dict], node_map: Dict[str, Any]) -> None:
        """Configure alarms from types.yaml alarm definitions."""
        for name, definition in alarm_defs.items():
            input_path = definition.get('inputNode', '')

            config = LimitAlarmConfig(
                name=name,
                description=definition.get('description', ''),
                severity=definition.get('severity', 500),
                input_node_path=input_path,
                high_high_limit=definition.get('highHighLimit'),
                high_limit=definition.get('highLimit'),
                low_limit=definition.get('lowLimit'),
                low_low_limit=definition.get('lowLowLimit'),
                message=definition.get('message', f'Alarm: {name}')
            )

            self.alarms[name] = config
            _logger.debug(f"Loaded alarm definition: {name}")

    def bind_alarm_to_pump(self, alarm_name: str, pump_node: Any, pump_nodes: Dict[str, Any]) -> bool:
        """Bind an alarm to a specific pump's input node."""
        if alarm_name not in self.alarms:
            return False

        config = self.alarms[alarm_name]
        input_path = config.input_node_path

        if input_path in pump_nodes:
            key = f"{alarm_name}_{id(pump_node)}"
            self.input_nodes[key] = pump_nodes[input_path]
            self.alarms[key] = LimitAlarmConfig(
                name=key,
                description=config.description,
                severity=config.severity,
                input_node_path=input_path,
                high_high_limit=config.high_high_limit,
                high_limit=config.high_limit,
                low_limit=config.low_limit,
                low_low_limit=config.low_low_limit,
                message=config.message
            )
            return True

        return False

    def check_value(self, alarm_key: str, value: float) -> Optional[AlarmEvent]:
        """Check a value against alarm limits and return event if state changed."""
        if alarm_key not in self.alarms:
            return None

        config = self.alarms[alarm_key]
        old_state = config.state
        new_state = AlarmState.NORMAL

        # Check limits (highest priority first)
        if config.high_high_limit is not None and value >= config.high_high_limit:
            new_state = AlarmState.HIGH_HIGH
        elif config.high_limit is not None and value >= config.high_limit:
            new_state = AlarmState.HIGH
        elif config.low_low_limit is not None and value <= config.low_low_limit:
            new_state = AlarmState.LOW_LOW
        elif config.low_limit is not None and value <= config.low_limit:
            new_state = AlarmState.LOW

        # Apply hysteresis for return to normal
        if old_state != AlarmState.NORMAL and new_state == AlarmState.NORMAL:
            if config.hysteresis > 0:
                # Check if value is within hysteresis band
                if old_state in (AlarmState.HIGH, AlarmState.HIGH_HIGH):
                    limit = config.high_limit or config.high_high_limit
                    if limit and value > (limit - config.hysteresis):
                        new_state = old_state  # Stay in alarm
                elif old_state in (AlarmState.LOW, AlarmState.LOW_LOW):
                    limit = config.low_limit or config.low_low_limit
                    if limit and value < (limit + config.hysteresis):
                        new_state = old_state  # Stay in alarm

        # Update state
        config.last_value = value
        config.state = new_state

        # State changed - generate event
        if new_state != old_state:
            config.is_active = new_state != AlarmState.NORMAL
            config.acknowledged = new_state == AlarmState.NORMAL

            if config.is_active:
                config.activated_at = datetime.utcnow()

            # Get the limit that was crossed
            limit = self._get_active_limit(config, new_state)

            event = AlarmEvent(
                alarm_name=alarm_key,
                state=new_state,
                value=value,
                limit=limit,
                severity=self._get_severity_for_state(config, new_state),
                message=self._format_message(config, new_state, value),
                timestamp=datetime.utcnow(),
                source_node=config.input_node_path
            )

            self._add_to_history(event)
            return event

        return None

    def _get_active_limit(self, config: LimitAlarmConfig, state: AlarmState) -> float:
        """Get the limit value for the current state."""
        limits = {
            AlarmState.HIGH_HIGH: config.high_high_limit,
            AlarmState.HIGH: config.high_limit,
            AlarmState.LOW: config.low_limit,
            AlarmState.LOW_LOW: config.low_low_limit,
        }
        return limits.get(state, 0.0) or 0.0

    def _get_severity_for_state(self, config: LimitAlarmConfig, state: AlarmState) -> int:
        """Get severity based on alarm state."""
        if state in (AlarmState.HIGH_HIGH, AlarmState.LOW_LOW):
            return min(1000, config.severity + 100)
        elif state in (AlarmState.HIGH, AlarmState.LOW):
            return config.severity
        return 0

    def _format_message(self, config: LimitAlarmConfig, state: AlarmState,
                        value: float) -> str:
        """Format alarm message."""
        state_names = {
            AlarmState.NORMAL: "returned to normal",
            AlarmState.HIGH: "high limit exceeded",
            AlarmState.HIGH_HIGH: "high-high limit exceeded",
            AlarmState.LOW: "low limit exceeded",
            AlarmState.LOW_LOW: "low-low limit exceeded",
        }
        state_text = state_names.get(state, "unknown")

        if config.message:
            return f"{config.message} - {state_text} (value: {value:.2f})"
        return f"{config.name}: {state_text} (value: {value:.2f})"

    def _add_to_history(self, event: AlarmEvent) -> None:
        """Add event to history."""
        self.event_history.append(event)
        if len(self.event_history) > self.max_history:
            self.event_history = self.event_history[-self.max_history:]

    def acknowledge_alarm(self, alarm_key: str) -> bool:
        """Acknowledge an alarm."""
        if alarm_key in self.alarms:
            self.alarms[alarm_key].acknowledged = True
            return True
        return False

    def get_active_alarms(self) -> List[Dict[str, Any]]:
        """Get all active alarms."""
        active = []
        for key, config in self.alarms.items():
            if config.is_active:
                active.append({
                    'name': key,
                    'state': config.state.name,
                    'value': config.last_value,
                    'severity': self._get_severity_for_state(config, config.state),
                    'message': self._format_message(config, config.state, config.last_value),
                    'acknowledged': config.acknowledged,
                    'activated_at': config.activated_at.isoformat() if config.activated_at else None
                })
        return active

    def get_alarm_history(self, limit: int = 100) -> List[Dict[str, Any]]:
        """Get alarm event history."""
        events = self.event_history[-limit:]
        return [
            {
                'alarm_name': e.alarm_name,
                'state': e.state.name,
                'value': e.value,
                'limit': e.limit,
                'severity': e.severity,
                'message': e.message,
                'timestamp': e.timestamp.isoformat(),
                'source_node': e.source_node,
                'acknowledged': e.acknowledged
            }
            for e in reversed(events)
        ]

    def get_alarm_status(self, alarm_key: str) -> Optional[Dict[str, Any]]:
        """Get status of a specific alarm."""
        if alarm_key not in self.alarms:
            return None

        config = self.alarms[alarm_key]
        return {
            'name': alarm_key,
            'state': config.state.name,
            'is_active': config.is_active,
            'acknowledged': config.acknowledged,
            'last_value': config.last_value,
            'limits': {
                'high_high': config.high_high_limit,
                'high': config.high_limit,
                'low': config.low_limit,
                'low_low': config.low_low_limit
            },
            'activated_at': config.activated_at.isoformat() if config.activated_at else None
        }


class PumpAlarmMonitor:
    """Monitors pump simulation values and checks alarms."""

    def __init__(self, alarm_manager: AlarmManager, pump_id: str):
        self.alarm_manager = alarm_manager
        self.pump_id = pump_id
        self.alarm_mappings: Dict[str, str] = {}  # variable_name -> alarm_key

    def register_alarm(self, variable_name: str, alarm_config: LimitAlarmConfig) -> str:
        """Register an alarm for a pump variable."""
        alarm_key = f"{self.pump_id}_{variable_name}_{alarm_config.name}"
        self.alarm_manager.alarms[alarm_key] = alarm_config
        self.alarm_mappings[variable_name] = alarm_key
        return alarm_key

    def check_values(self, values: Dict[str, float]) -> List[AlarmEvent]:
        """Check all values against registered alarms."""
        events = []
        for var_name, alarm_key in self.alarm_mappings.items():
            if var_name in values:
                event = self.alarm_manager.check_value(alarm_key, values[var_name])
                if event:
                    events.append(event)
        return events

    def get_active_alarms(self) -> List[Dict[str, Any]]:
        """Get active alarms for this pump."""
        active = []
        for var_name, alarm_key in self.alarm_mappings.items():
            status = self.alarm_manager.get_alarm_status(alarm_key)
            if status and status['is_active']:
                status['variable'] = var_name
                active.append(status)
        return active
