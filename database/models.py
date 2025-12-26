"""SQLite database models for OPC-UA server.

Stores:
- Type definitions (imported from types.yaml)
- Asset templates (default from assets.json + custom)
- Server state
- Simulation history
- Address space configurations
"""

from datetime import datetime
from typing import Optional, Dict, Any
from sqlalchemy import (
    create_engine, Column, Integer, String, Float, Boolean,
    DateTime, Text, ForeignKey, JSON, Enum as SQLEnum
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship, sessionmaker
import enum

Base = declarative_base()


class SimulationModeEnum(enum.Enum):
    """Simulation mode enumeration."""
    OPTIMAL = "OPTIMAL"
    AGED = "AGED"
    DEGRADED = "DEGRADED"
    FAILURE = "FAILURE"


class FailureTypeEnum(enum.Enum):
    """Failure type enumeration."""
    NONE = "NONE"
    BEARING = "BEARING"
    SEAL = "SEAL"
    CAVITATION = "CAVITATION"
    IMPELLER = "IMPELLER"
    MOTOR = "MOTOR"


class ServerStatusEnum(enum.Enum):
    """Server status enumeration."""
    STOPPED = "stopped"
    STARTING = "starting"
    RUNNING = "running"
    STOPPING = "stopping"
    ERROR = "error"


class TypeDefinition(Base):
    """OPC-UA type definitions (imported from types.yaml)."""
    __tablename__ = 'type_definitions'

    id = Column(Integer, primary_key=True)
    name = Column(String(100), unique=True, nullable=False)
    base_type = Column(String(100), default='BaseObjectType')
    is_abstract = Column(Boolean, default=False)
    description = Column(Text, default='')
    definition_json = Column(JSON, nullable=False)  # Full type definition
    is_builtin = Column(Boolean, default=False)  # True if from types.yaml
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self) -> Dict[str, Any]:
        return {
            'id': self.id,
            'name': self.name,
            'base_type': self.base_type,
            'is_abstract': self.is_abstract,
            'description': self.description,
            'definition': self.definition_json,
            'is_builtin': self.is_builtin,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class AssetTemplate(Base):
    """Asset templates for creating new assets."""
    __tablename__ = 'asset_templates'

    id = Column(Integer, primary_key=True)
    name = Column(String(100), unique=True, nullable=False)
    display_name = Column(String(200))
    description = Column(Text, default='')
    type_name = Column(String(100), nullable=False)  # PumpType, InfluentPumpType, etc.
    template_json = Column(JSON, nullable=False)  # Full asset template
    design_specs_json = Column(JSON)  # Design specifications
    is_default = Column(Boolean, default=False)  # True if from assets.json
    is_enabled = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self) -> Dict[str, Any]:
        return {
            'id': self.id,
            'name': self.name,
            'display_name': self.display_name,
            'description': self.description,
            'type_name': self.type_name,
            'template': self.template_json,
            'design_specs': self.design_specs_json,
            'is_default': self.is_default,
            'is_enabled': self.is_enabled,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class AssetInstance(Base):
    """Asset instances in the address space."""
    __tablename__ = 'asset_instances'

    id = Column(Integer, primary_key=True)
    asset_id = Column(String(100), unique=True, nullable=False)  # e.g., IPS_PMP_001
    name = Column(String(100), nullable=False)
    display_name = Column(String(200))
    description = Column(Text, default='')
    type_name = Column(String(100), nullable=False)
    parent_id = Column(String(100))  # Parent asset ID
    hierarchy_level = Column(String(50))  # Plant, Process, System, Asset
    properties_json = Column(JSON)
    design_specs_json = Column(JSON)
    is_simulated = Column(Boolean, default=False)
    is_default = Column(Boolean, default=False)  # True if from assets.json
    is_enabled = Column(Boolean, default=True)
    template_id = Column(Integer, ForeignKey('asset_templates.id'), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    template = relationship('AssetTemplate', backref='instances')

    def to_dict(self) -> Dict[str, Any]:
        return {
            'id': self.id,
            'asset_id': self.asset_id,
            'name': self.name,
            'display_name': self.display_name,
            'description': self.description,
            'type_name': self.type_name,
            'parent_id': self.parent_id,
            'hierarchy_level': self.hierarchy_level,
            'properties': self.properties_json,
            'design_specs': self.design_specs_json,
            'is_simulated': self.is_simulated,
            'is_default': self.is_default,
            'is_enabled': self.is_enabled,
            'template_id': self.template_id,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class ServerState(Base):
    """Server runtime state (singleton)."""
    __tablename__ = 'server_state'

    id = Column(Integer, primary_key=True, default=1)
    status = Column(SQLEnum(ServerStatusEnum), default=ServerStatusEnum.STOPPED)
    endpoint_url = Column(String(200), default='opc.tcp://0.0.0.0:4840/freeopcua/server/')
    simulation_mode = Column(SQLEnum(SimulationModeEnum), default=SimulationModeEnum.OPTIMAL)
    simulation_interval_ms = Column(Float, default=1000.0)
    time_acceleration = Column(Float, default=1.0)
    diurnal_enabled = Column(Boolean, default=True)
    started_at = Column(DateTime)
    stopped_at = Column(DateTime)
    error_message = Column(Text)
    pid = Column(Integer)

    # Aged config
    aged_years = Column(Float, default=5.0)
    aged_hours_per_year = Column(Float, default=6000.0)
    aged_starts_per_year = Column(Integer, default=500)

    # Degraded config
    degraded_impeller_wear = Column(Float, default=15.0)
    degraded_bearing_wear = Column(Float, default=20.0)
    degraded_seal_wear = Column(Float, default=25.0)

    # Failure config
    failure_type = Column(SQLEnum(FailureTypeEnum), default=FailureTypeEnum.NONE)
    failure_progression = Column(Float, default=0.0)
    failure_time_to_failure = Column(Float, default=100.0)

    # Flow profile
    flow_base = Column(Float, default=1600.0)
    flow_peak = Column(Float, default=4000.0)
    flow_peak_hour_1 = Column(Integer, default=7)
    flow_peak_hour_2 = Column(Integer, default=19)

    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self) -> Dict[str, Any]:
        return {
            'status': self.status.value if self.status else 'stopped',
            'endpoint_url': self.endpoint_url,
            'simulation_mode': self.simulation_mode.value if self.simulation_mode else 'OPTIMAL',
            'simulation_interval_ms': self.simulation_interval_ms,
            'time_acceleration': self.time_acceleration,
            'diurnal_enabled': self.diurnal_enabled,
            'started_at': self.started_at.isoformat() if self.started_at else None,
            'stopped_at': self.stopped_at.isoformat() if self.stopped_at else None,
            'error_message': self.error_message,
            'aged_config': {
                'years': self.aged_years,
                'hours_per_year': self.aged_hours_per_year,
                'starts_per_year': self.aged_starts_per_year
            },
            'degraded_config': {
                'impeller_wear': self.degraded_impeller_wear,
                'bearing_wear': self.degraded_bearing_wear,
                'seal_wear': self.degraded_seal_wear
            },
            'failure_config': {
                'type': self.failure_type.value if self.failure_type else 'NONE',
                'progression': self.failure_progression,
                'time_to_failure': self.failure_time_to_failure
            },
            'flow_profile': {
                'base': self.flow_base,
                'peak': self.flow_peak,
                'peak_hour_1': self.flow_peak_hour_1,
                'peak_hour_2': self.flow_peak_hour_2
            }
        }


class AddressSpaceConfig(Base):
    """Address space configuration presets."""
    __tablename__ = 'address_space_configs'

    id = Column(Integer, primary_key=True)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(Text, default='')
    include_defaults = Column(Boolean, default=True)
    included_asset_ids = Column(JSON)  # List of asset IDs to include
    excluded_asset_ids = Column(JSON)  # List of asset IDs to exclude
    is_active = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self) -> Dict[str, Any]:
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'include_defaults': self.include_defaults,
            'included_asset_ids': self.included_asset_ids,
            'excluded_asset_ids': self.excluded_asset_ids,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class SimulationRun(Base):
    """Simulation run history."""
    __tablename__ = 'simulation_runs'

    id = Column(Integer, primary_key=True)
    started_at = Column(DateTime, nullable=False)
    ended_at = Column(DateTime)
    mode = Column(SQLEnum(SimulationModeEnum))
    config_id = Column(Integer, ForeignKey('address_space_configs.id'), nullable=True)
    total_runtime_hours = Column(Float, default=0.0)
    pump_starts = Column(Integer, default=0)
    notes = Column(Text)

    config = relationship('AddressSpaceConfig', backref='runs')

    def to_dict(self) -> Dict[str, Any]:
        return {
            'id': self.id,
            'started_at': self.started_at.isoformat() if self.started_at else None,
            'ended_at': self.ended_at.isoformat() if self.ended_at else None,
            'mode': self.mode.value if self.mode else None,
            'config_id': self.config_id,
            'total_runtime_hours': self.total_runtime_hours,
            'pump_starts': self.pump_starts,
            'notes': self.notes
        }


def create_tables(engine):
    """Create all tables."""
    Base.metadata.create_all(engine)


def get_engine(db_path: str = 'config/server.db'):
    """Get SQLAlchemy engine."""
    return create_engine(f'sqlite:///{db_path}', echo=False)


def get_session(engine):
    """Get SQLAlchemy session."""
    Session = sessionmaker(bind=engine)
    return Session()
