"""FastAPI REST API for OPC-UA server control and configuration.

Provides endpoints for:
- Server control (start/stop/status)
- Simulation mode management
- Asset and template CRUD
- Address space configuration
"""

import asyncio
import logging
import os
import signal
import subprocess
import sys
from datetime import datetime
from typing import Optional, List, Dict, Any
from pathlib import Path

from fastapi import FastAPI, HTTPException, BackgroundTasks, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from .websocket import ws_manager

# Add parent to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from database.manager import DatabaseManager
from config.loader import ConfigLoader

_logger = logging.getLogger('api')

# Configuration loader for types.yaml and assets.json
config_loader: Optional[ConfigLoader] = None

# Global references
db: Optional[DatabaseManager] = None
opcua_process: Optional[subprocess.Popen] = None


def create_app() -> FastAPI:
    """Create FastAPI application."""
    application = FastAPI(
        title="OPC-UA Pump Simulation Server API",
        description="REST API for controlling the OPC-UA pump simulation server",
        version="1.0.0"
    )

    # CORS for frontend
    application.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    return application


app = create_app()


# =============================================================================
# PYDANTIC MODELS
# =============================================================================

class ServerStatus(BaseModel):
    status: str
    endpoint_url: str
    simulation_mode: str
    simulation_interval_ms: float
    time_acceleration: float
    diurnal_enabled: bool
    started_at: Optional[str]
    error_message: Optional[str]
    aged_config: Dict[str, Any]
    degraded_config: Dict[str, Any]
    failure_config: Dict[str, Any]
    flow_profile: Dict[str, Any]


class SimulationModeRequest(BaseModel):
    mode: str = Field(..., description="OPTIMAL, AGED, DEGRADED, or FAILURE")


class SimulationConfigRequest(BaseModel):
    simulation_interval_ms: Optional[float] = None
    time_acceleration: Optional[float] = None
    diurnal_enabled: Optional[bool] = None
    aged_years: Optional[float] = None
    aged_hours_per_year: Optional[float] = None
    degraded_impeller_wear: Optional[float] = None
    degraded_bearing_wear: Optional[float] = None
    degraded_seal_wear: Optional[float] = None
    failure_type: Optional[str] = None
    failure_progression: Optional[float] = None
    flow_base: Optional[float] = None
    flow_peak: Optional[float] = None


class AssetCreate(BaseModel):
    asset_id: str
    name: str
    type_name: str
    parent_id: str
    display_name: Optional[str] = None
    description: Optional[str] = None
    hierarchy_level: str = "Asset"
    properties: Optional[Dict[str, Any]] = None
    design_specs: Optional[Dict[str, Any]] = None
    is_simulated: bool = True
    template_id: Optional[int] = None


class AssetUpdate(BaseModel):
    name: Optional[str] = None
    display_name: Optional[str] = None
    description: Optional[str] = None
    properties: Optional[Dict[str, Any]] = None
    design_specs: Optional[Dict[str, Any]] = None
    is_enabled: Optional[bool] = None
    is_simulated: Optional[bool] = None


class TemplateCreate(BaseModel):
    name: str
    type_name: str
    template: Dict[str, Any]
    display_name: Optional[str] = None
    description: Optional[str] = None
    design_specs: Optional[Dict[str, Any]] = None


class ConfigCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    include_defaults: bool = True
    included_asset_ids: Optional[List[str]] = None
    excluded_asset_ids: Optional[List[str]] = None


# =============================================================================
# STARTUP / SHUTDOWN
# =============================================================================

@app.on_event("startup")
async def startup_event():
    """Initialize database on startup."""
    global db, config_loader
    db = DatabaseManager()
    db.initialize()
    config_loader = ConfigLoader()
    _logger.info("API server started, database initialized")


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown."""
    global db, opcua_process
    if opcua_process:
        opcua_process.terminate()
    if db:
        db.close()
    _logger.info("API server shutdown")


# =============================================================================
# SERVER CONTROL ENDPOINTS
# =============================================================================

@app.get("/api/server/status", response_model=ServerStatus, tags=["Server"])
async def get_server_status():
    """Get current server status and configuration."""
    return db.get_server_state()


@app.post("/api/server/start", tags=["Server"])
async def start_server(background_tasks: BackgroundTasks):
    """Start the OPC-UA server."""
    global opcua_process

    state = db.get_server_state()
    if state['status'] == 'running':
        raise HTTPException(status_code=400, detail="Server is already running")

    db.update_server_state(status='starting')

    try:
        # Start server as subprocess
        server_path = Path(__file__).parent.parent / "server.py"
        opcua_process = subprocess.Popen(
            [sys.executable, str(server_path)],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            cwd=str(server_path.parent)
        )

        db.set_server_running(pid=opcua_process.pid)
        db.start_simulation_run(mode=state.get('simulation_mode', 'OPTIMAL'))

        return {"message": "Server started", "pid": opcua_process.pid}

    except Exception as e:
        db.set_server_stopped(error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/server/stop", tags=["Server"])
async def stop_server():
    """Stop the OPC-UA server."""
    global opcua_process

    state = db.get_server_state()
    if state['status'] != 'running':
        raise HTTPException(status_code=400, detail="Server is not running")

    db.update_server_state(status='stopping')

    try:
        if opcua_process:
            opcua_process.terminate()
            opcua_process.wait(timeout=10)
            opcua_process = None

        db.set_server_stopped()
        return {"message": "Server stopped"}

    except Exception as e:
        db.set_server_stopped(error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/server/restart", tags=["Server"])
async def restart_server(background_tasks: BackgroundTasks):
    """Restart the OPC-UA server."""
    await stop_server()
    await asyncio.sleep(1)
    return await start_server(background_tasks)


# =============================================================================
# SIMULATION CONTROL ENDPOINTS
# =============================================================================

@app.get("/api/simulation", tags=["Simulation"])
async def get_simulation_config():
    """Get current simulation configuration."""
    return db.get_server_state()


@app.put("/api/simulation/mode", tags=["Simulation"])
@app.post("/api/simulation/mode", tags=["Simulation"])
async def set_simulation_mode(request: SimulationModeRequest):
    """Change simulation mode."""
    valid_modes = ['OPTIMAL', 'AGED', 'DEGRADED', 'FAILURE']
    if request.mode not in valid_modes:
        raise HTTPException(status_code=400, detail=f"Invalid mode. Must be one of: {valid_modes}")

    state = db.update_server_state(simulation_mode=request.mode)
    return {"message": f"Mode changed to {request.mode}", "state": state}


@app.put("/api/simulation/config", tags=["Simulation"])
async def update_simulation_config(request: SimulationConfigRequest):
    """Update simulation configuration parameters."""
    update_data = {k: v for k, v in request.dict().items() if v is not None}
    state = db.update_server_state(**update_data)
    return {"message": "Configuration updated", "state": state}


@app.post("/api/simulation/reset", tags=["Simulation"])
async def reset_simulation():
    """Reset simulation to OPTIMAL mode with default values."""
    state = db.update_server_state(
        simulation_mode='OPTIMAL',
        failure_type='NONE',
        failure_progression=0.0,
        aged_years=5.0,
        degraded_impeller_wear=15.0,
        degraded_bearing_wear=20.0,
        degraded_seal_wear=25.0
    )
    return {"message": "Simulation reset to OPTIMAL", "state": state}


class TriggerFailureRequest(BaseModel):
    failure_type: str = Field(..., description="BEARING, SEAL, CAVITATION, IMPELLER, or MOTOR")


@app.post("/api/simulation/trigger-failure", tags=["Simulation"])
async def trigger_failure(request: TriggerFailureRequest):
    """Trigger a failure simulation."""
    valid_types = ['BEARING', 'SEAL', 'CAVITATION', 'IMPELLER', 'MOTOR']
    if request.failure_type not in valid_types:
        raise HTTPException(status_code=400, detail=f"Invalid failure type. Must be one of: {valid_types}")

    state = db.update_server_state(
        simulation_mode='FAILURE',
        failure_type=request.failure_type,
        failure_progression=0.0
    )
    return {"message": f"Triggered {request.failure_type} failure", "state": state}


# =============================================================================
# TYPE ENDPOINTS
# =============================================================================

@app.get("/api/types", tags=["Types"])
async def get_types():
    """Get all type definitions."""
    return db.get_types()


@app.get("/api/types/{name}", tags=["Types"])
async def get_type(name: str):
    """Get a specific type definition."""
    type_def = db.get_type(name)
    if not type_def:
        raise HTTPException(status_code=404, detail="Type not found")
    return type_def


# =============================================================================
# CONFIGURATION FILE ENDPOINTS (types.yaml & assets.json visualization)
# =============================================================================

@app.get("/api/config/types-yaml", tags=["Configuration"])
async def get_types_yaml():
    """Get the full types.yaml configuration for visualization."""
    try:
        raw_config = config_loader.load_types()
        type_defs = config_loader.get_type_definitions()
        engineering_units = config_loader.get_engineering_units()
        data_types = config_loader.get_data_types()
        alarm_types = config_loader.get_alarm_types()

        # Build inheritance hierarchy
        inheritance = {}
        for name, type_def in type_defs.items():
            inheritance[name] = {
                "name": name,
                "base": type_def.base,
                "isAbstract": type_def.is_abstract,
                "description": type_def.description,
                "propertyCount": len(type_def.properties),
                "componentCount": len(type_def.components),
                "methodCount": len(type_def.methods),
            }

        # Convert type definitions to serializable format
        types_data = {}
        for name, type_def in type_defs.items():
            types_data[name] = {
                "name": name,
                "base": type_def.base,
                "isAbstract": type_def.is_abstract,
                "description": type_def.description,
                "properties": {
                    pname: {
                        "name": pname,
                        "type": prop.component_type,
                        "dataType": prop.data_type,
                        "description": prop.description,
                        "modellingRule": prop.modelling_rule,
                        "accessLevel": prop.access_level,
                    }
                    for pname, prop in type_def.properties.items()
                },
                "components": {
                    cname: {
                        "name": cname,
                        "type": comp.component_type,
                        "dataType": comp.data_type,
                        "description": comp.description,
                        "modellingRule": comp.modelling_rule,
                        "accessLevel": comp.access_level,
                        "engineeringUnits": comp.engineering_units,
                        "euRange": {"low": comp.eu_range.low, "high": comp.eu_range.high} if comp.eu_range else None,
                        "instrumentRange": {"low": comp.instrument_range.low, "high": comp.instrument_range.high} if comp.instrument_range else None,
                        "trueState": comp.true_state,
                        "falseState": comp.false_state,
                        "nestedComponents": {
                            ncname: {
                                "name": ncname,
                                "type": nc.component_type,
                                "dataType": nc.data_type,
                                "description": nc.description,
                                "engineeringUnits": nc.engineering_units,
                            }
                            for ncname, nc in comp.components.items()
                        } if comp.components else None,
                    }
                    for cname, comp in type_def.components.items()
                },
                "methods": {
                    mname: {
                        "name": mname,
                        "description": method.description,
                        "inputArguments": method.input_arguments,
                        "outputArguments": method.output_arguments,
                    }
                    for mname, method in type_def.methods.items()
                },
            }

        # Engineering units
        units_data = {
            name: {
                "name": name,
                "displayName": unit.display_name,
                "description": unit.description,
                "unitId": unit.unit_id,
            }
            for name, unit in engineering_units.items()
        }

        # Data types (enums and structures)
        data_types_data = {}
        for name, dt in data_types.items():
            data_types_data[name] = {
                "name": name,
                "type": dt.get("type"),
                "description": dt.get("description", ""),
                "fields": dt.get("fields"),
                "values": dt.get("values"),
            }

        # Alarm types
        alarms_data = {
            name: {
                "name": name,
                "type": alarm.alarm_type,
                "description": alarm.description,
                "severity": alarm.severity,
                "inputNode": alarm.input_node,
                "highHighLimit": alarm.high_high_limit,
                "highLimit": alarm.high_limit,
                "lowLimit": alarm.low_limit,
                "lowLowLimit": alarm.low_low_limit,
                "message": alarm.message,
            }
            for name, alarm in alarm_types.items()
        }

        return {
            "namespaceUri": raw_config.get("namespaceUri"),
            "namespace": raw_config.get("namespace"),
            "inheritance": inheritance,
            "types": types_data,
            "engineeringUnits": units_data,
            "dataTypes": data_types_data,
            "alarmTypes": alarms_data,
            "summary": raw_config.get("summary", {}),
        }

    except Exception as e:
        _logger.error(f"Error loading types.yaml: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/config/assets-json", tags=["Configuration"])
async def get_assets_json():
    """Get the full assets.json configuration for visualization."""
    try:
        raw_config = config_loader.load_assets()
        asset_defs = config_loader.get_asset_definitions()

        # Build hierarchy tree
        assets_by_parent: Dict[str, List[Dict]] = {}
        assets_by_id: Dict[str, Dict] = {}

        for asset in asset_defs:
            asset_data = {
                "id": asset.id,
                "name": asset.name,
                "displayName": asset.display_name,
                "type": asset.asset_type,
                "parent": asset.parent,
                "description": asset.description,
                "hierarchyLevel": asset.hierarchy_level,
                "simulate": asset.simulate,
                "properties": asset.properties,
                "designSpecs": asset.design_specs,
                "alarms": asset.alarms,
            }
            assets_by_id[asset.id] = asset_data

            if asset.parent not in assets_by_parent:
                assets_by_parent[asset.parent] = []
            assets_by_parent[asset.parent].append(asset_data)

        # Build tree structure recursively
        def build_tree(parent_id: str) -> List[Dict]:
            children = assets_by_parent.get(parent_id, [])
            for child in children:
                child["children"] = build_tree(child["id"])
            return children

        tree = build_tree("ObjectsFolder")

        # Group assets by type
        assets_by_type: Dict[str, List[Dict]] = {}
        for asset in asset_defs:
            if asset.asset_type not in assets_by_type:
                assets_by_type[asset.asset_type] = []
            assets_by_type[asset.asset_type].append({
                "id": asset.id,
                "name": asset.name,
                "displayName": asset.display_name,
                "parent": asset.parent,
                "hierarchyLevel": asset.hierarchy_level,
                "simulate": asset.simulate,
            })

        # Group assets by hierarchy level
        assets_by_level: Dict[str, List[Dict]] = {}
        for asset in asset_defs:
            level = asset.hierarchy_level or "Other"
            if level not in assets_by_level:
                assets_by_level[level] = []
            assets_by_level[level].append({
                "id": asset.id,
                "name": asset.name,
                "type": asset.asset_type,
            })

        return {
            "metadata": raw_config.get("metadata", {}),
            "summary": raw_config.get("summary", {}),
            "tree": tree,
            "assets": [assets_by_id[a.id] for a in asset_defs],
            "assetsByType": assets_by_type,
            "assetsByLevel": assets_by_level,
            "assetCount": len(asset_defs),
        }

    except Exception as e:
        _logger.error(f"Error loading assets.json: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# =============================================================================
# ASSET ENDPOINTS
# =============================================================================

@app.get("/api/assets", tags=["Assets"])
async def get_assets(include_disabled: bool = False):
    """Get all asset instances."""
    return db.get_assets(include_disabled=include_disabled)


@app.get("/api/assets/tree", tags=["Assets"])
async def get_asset_tree():
    """Get assets as a hierarchical tree."""
    return db.get_asset_hierarchy()


@app.get("/api/assets/{asset_id}", tags=["Assets"])
async def get_asset(asset_id: str):
    """Get a specific asset."""
    asset = db.get_asset(asset_id)
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    return asset


@app.post("/api/assets", tags=["Assets"])
async def create_asset(request: AssetCreate):
    """Create a new asset instance."""
    existing = db.get_asset(request.asset_id)
    if existing:
        raise HTTPException(status_code=400, detail="Asset ID already exists")

    asset = db.add_asset(
        asset_id=request.asset_id,
        name=request.name,
        type_name=request.type_name,
        parent_id=request.parent_id,
        display_name=request.display_name or request.name,
        description=request.description or '',
        hierarchy_level=request.hierarchy_level,
        properties=request.properties,
        design_specs=request.design_specs,
        is_simulated=request.is_simulated,
        template_id=request.template_id
    )
    return asset


@app.put("/api/assets/{asset_id}", tags=["Assets"])
async def update_asset(asset_id: str, request: AssetUpdate):
    """Update an asset instance."""
    update_data = {k: v for k, v in request.dict().items() if v is not None}
    asset = db.update_asset(asset_id, **update_data)
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    return asset


@app.delete("/api/assets/{asset_id}", tags=["Assets"])
async def delete_asset(asset_id: str):
    """Delete an asset (custom assets only)."""
    success = db.delete_asset(asset_id)
    if not success:
        raise HTTPException(status_code=400, detail="Cannot delete default assets or asset not found")
    return {"message": "Asset deleted"}


@app.post("/api/assets/{asset_id}/toggle", tags=["Assets"])
async def toggle_asset(asset_id: str, enabled: bool):
    """Enable or disable an asset."""
    success = db.toggle_asset(asset_id, enabled)
    if not success:
        raise HTTPException(status_code=404, detail="Asset not found")
    return {"message": f"Asset {'enabled' if enabled else 'disabled'}"}


# =============================================================================
# TEMPLATE ENDPOINTS
# =============================================================================

@app.get("/api/templates", tags=["Templates"])
async def get_templates(include_disabled: bool = False):
    """Get all asset templates."""
    return db.get_templates(include_disabled=include_disabled)


@app.get("/api/templates/{template_id}", tags=["Templates"])
async def get_template(template_id: int):
    """Get a specific template."""
    template = db.get_template(template_id)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    return template


@app.post("/api/templates", tags=["Templates"])
async def create_template(request: TemplateCreate):
    """Create a new asset template."""
    template = db.add_template(
        name=request.name,
        type_name=request.type_name,
        template=request.template,
        display_name=request.display_name or request.name,
        description=request.description or '',
        design_specs=request.design_specs
    )
    return template


@app.put("/api/templates/{template_id}", tags=["Templates"])
async def update_template(template_id: int, request: TemplateCreate):
    """Update a template."""
    update_data = {k: v for k, v in request.dict().items() if v is not None}
    template = db.update_template(template_id, **update_data)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    return template


@app.delete("/api/templates/{template_id}", tags=["Templates"])
async def delete_template(template_id: int):
    """Delete a template (custom templates only)."""
    success = db.delete_template(template_id)
    if not success:
        raise HTTPException(status_code=400, detail="Cannot delete default templates or template not found")
    return {"message": "Template deleted"}


# =============================================================================
# CONFIG ENDPOINTS
# =============================================================================

@app.get("/api/configs", tags=["Configurations"])
async def get_configs():
    """Get all address space configurations."""
    return db.get_configs()


@app.get("/api/configs/active", tags=["Configurations"])
async def get_active_config():
    """Get the active configuration."""
    config = db.get_active_config()
    if not config:
        raise HTTPException(status_code=404, detail="No active configuration")
    return config


@app.post("/api/configs", tags=["Configurations"])
async def create_config(request: ConfigCreate):
    """Create a new address space configuration."""
    config = db.add_config(
        name=request.name,
        description=request.description or '',
        include_defaults=request.include_defaults,
        included_asset_ids=request.included_asset_ids,
        excluded_asset_ids=request.excluded_asset_ids
    )
    return config


@app.post("/api/configs/{config_id}/activate", tags=["Configurations"])
async def activate_config(config_id: int):
    """Set a configuration as active."""
    success = db.set_active_config(config_id)
    if not success:
        raise HTTPException(status_code=404, detail="Configuration not found")
    return {"message": "Configuration activated"}


# =============================================================================
# SIMULATION HISTORY ENDPOINTS
# =============================================================================

@app.get("/api/history", tags=["History"])
async def get_simulation_history(limit: int = 100):
    """Get simulation run history."""
    return db.get_simulation_runs(limit=limit)


# =============================================================================
# PUMP CONTROL ENDPOINTS
# =============================================================================

from .engine_bridge import get_engine, is_engine_available


class PumpSpeedRequest(BaseModel):
    rpm: float = Field(..., ge=0, le=1800, description="Target RPM")


@app.get("/api/pumps", tags=["Pumps"])
async def get_pumps():
    """Get all pump assets with hierarchy path and live status."""
    assets = db.get_assets()
    pumps = [a for a in assets if a.get('type_name') in ('PumpType', 'InfluentPumpType')]

    # Build asset lookup for hierarchy resolution
    asset_lookup = {a['asset_id']: a for a in assets}

    # Get live pump data from simulation engine if available
    engine = get_engine()
    live_data = {}
    if engine:
        live_data = engine.get_all_pump_states()

    # Add hierarchy path and live status to each pump
    for pump in pumps:
        path_parts = []
        current_id = pump.get('parent_id')
        while current_id and current_id != 'ObjectsFolder':
            parent = asset_lookup.get(current_id)
            if parent:
                path_parts.insert(0, parent.get('name', current_id))
                current_id = parent.get('parent_id')
            else:
                break
        path_parts.append(pump.get('name', pump.get('asset_id')))
        pump['hierarchy_path'] = '/'.join(path_parts)
        pump['browse_path'] = f"Objects/{'/'.join(path_parts)}"

        # Add live status if available
        pump_id = pump.get('asset_id')
        if pump_id in live_data:
            pump['live_data'] = live_data[pump_id]
            pump['is_running'] = live_data[pump_id].get('is_running', False)
            pump['is_faulted'] = live_data[pump_id].get('is_faulted', False)

    return pumps


@app.get("/api/pumps/{pump_id}", tags=["Pumps"])
async def get_pump(pump_id: str):
    """Get a specific pump with live data."""
    asset = db.get_asset(pump_id)
    if not asset:
        raise HTTPException(status_code=404, detail="Pump not found")
    if asset.get('type_name') not in ('PumpType', 'InfluentPumpType'):
        raise HTTPException(status_code=400, detail="Asset is not a pump")

    # Get live data from simulation engine
    engine = get_engine()
    if engine:
        pump_sim = engine.get_pump(pump_id)
        if pump_sim:
            asset['live_data'] = pump_sim.get_state()
            asset['is_running'] = pump_sim.is_running
            asset['is_faulted'] = pump_sim.is_faulted

    return asset


@app.post("/api/pumps/{pump_id}/start", tags=["Pumps"])
async def start_pump(pump_id: str):
    """Start a specific pump."""
    asset = db.get_asset(pump_id)
    if not asset:
        raise HTTPException(status_code=404, detail="Pump not found")
    if asset.get('type_name') not in ('PumpType', 'InfluentPumpType'):
        raise HTTPException(status_code=400, detail="Asset is not a pump")

    # Get simulation engine and start pump
    engine = get_engine()
    if not engine:
        raise HTTPException(
            status_code=503,
            detail="Simulation engine not available. Ensure server is running with --with-api flag."
        )

    pump_sim = engine.get_pump(pump_id)
    if not pump_sim:
        raise HTTPException(status_code=404, detail=f"Pump {pump_id} not found in simulation engine")

    if pump_sim.is_faulted:
        raise HTTPException(status_code=400, detail="Cannot start faulted pump. Reset fault first.")

    if pump_sim.is_running:
        return {"message": f"Pump {pump_id} is already running", "pump_id": pump_id, "success": True}

    await pump_sim.start()
    _logger.info(f"Pump {pump_id} started via API")

    return {
        "message": f"Pump {pump_id} started successfully",
        "pump_id": pump_id,
        "success": True,
        "is_running": pump_sim.is_running
    }


@app.post("/api/pumps/{pump_id}/stop", tags=["Pumps"])
async def stop_pump(pump_id: str):
    """Stop a specific pump."""
    asset = db.get_asset(pump_id)
    if not asset:
        raise HTTPException(status_code=404, detail="Pump not found")
    if asset.get('type_name') not in ('PumpType', 'InfluentPumpType'):
        raise HTTPException(status_code=400, detail="Asset is not a pump")

    # Get simulation engine and stop pump
    engine = get_engine()
    if not engine:
        raise HTTPException(
            status_code=503,
            detail="Simulation engine not available. Ensure server is running with --with-api flag."
        )

    pump_sim = engine.get_pump(pump_id)
    if not pump_sim:
        raise HTTPException(status_code=404, detail=f"Pump {pump_id} not found in simulation engine")

    if not pump_sim.is_running:
        return {"message": f"Pump {pump_id} is already stopped", "pump_id": pump_id, "success": True}

    await pump_sim.stop()
    _logger.info(f"Pump {pump_id} stopped via API")

    return {
        "message": f"Pump {pump_id} stopped successfully",
        "pump_id": pump_id,
        "success": True,
        "is_running": pump_sim.is_running
    }


@app.post("/api/pumps/{pump_id}/speed", tags=["Pumps"])
async def set_pump_speed(pump_id: str, request: PumpSpeedRequest):
    """Set pump speed (RPM)."""
    asset = db.get_asset(pump_id)
    if not asset:
        raise HTTPException(status_code=404, detail="Pump not found")
    if asset.get('type_name') not in ('PumpType', 'InfluentPumpType'):
        raise HTTPException(status_code=400, detail="Asset is not a pump")

    # Get simulation engine and set speed
    engine = get_engine()
    if not engine:
        raise HTTPException(
            status_code=503,
            detail="Simulation engine not available. Ensure server is running with --with-api flag."
        )

    pump_sim = engine.get_pump(pump_id)
    if not pump_sim:
        raise HTTPException(status_code=404, detail=f"Pump {pump_id} not found in simulation engine")

    if not pump_sim.is_running:
        raise HTTPException(status_code=400, detail="Pump must be running to set speed")

    # Validate RPM against design specs
    min_rpm = pump_sim.design_specs.get('MinRPM', 0)
    max_rpm = pump_sim.design_specs.get('MaxRPM', 1800)

    if request.rpm < min_rpm or request.rpm > max_rpm:
        raise HTTPException(
            status_code=400,
            detail=f"RPM must be between {min_rpm} and {max_rpm} for this pump"
        )

    success = pump_sim.set_speed(request.rpm)
    if success:
        _logger.info(f"Pump {pump_id} speed set to {request.rpm} RPM via API")
        return {
            "message": f"Speed set to {request.rpm} RPM for pump {pump_id}",
            "pump_id": pump_id,
            "rpm": request.rpm,
            "success": True
        }
    else:
        raise HTTPException(status_code=400, detail="Failed to set pump speed")


@app.post("/api/pumps/{pump_id}/reset-fault", tags=["Pumps"])
async def reset_pump_fault(pump_id: str):
    """Reset pump fault status."""
    asset = db.get_asset(pump_id)
    if not asset:
        raise HTTPException(status_code=404, detail="Pump not found")
    if asset.get('type_name') not in ('PumpType', 'InfluentPumpType'):
        raise HTTPException(status_code=400, detail="Asset is not a pump")

    engine = get_engine()
    if not engine:
        raise HTTPException(
            status_code=503,
            detail="Simulation engine not available. Ensure server is running with --with-api flag."
        )

    pump_sim = engine.get_pump(pump_id)
    if not pump_sim:
        raise HTTPException(status_code=404, detail=f"Pump {pump_id} not found in simulation engine")

    if not pump_sim.is_faulted:
        return {"message": f"Pump {pump_id} is not faulted", "pump_id": pump_id, "success": True}

    pump_sim.is_faulted = False
    _logger.info(f"Pump {pump_id} fault reset via API")

    return {
        "message": f"Pump {pump_id} fault reset successfully",
        "pump_id": pump_id,
        "success": True,
        "is_faulted": pump_sim.is_faulted
    }


@app.post("/api/pumps/start-all", tags=["Pumps"])
async def start_all_pumps():
    """Start all pumps."""
    engine = get_engine()
    if not engine:
        raise HTTPException(
            status_code=503,
            detail="Simulation engine not available. Ensure server is running with --with-api flag."
        )

    started = []
    skipped = []

    for pump_id, pump_sim in engine.pumps.items():
        if pump_sim.is_faulted:
            skipped.append({"id": pump_id, "reason": "faulted"})
        elif pump_sim.is_running:
            skipped.append({"id": pump_id, "reason": "already_running"})
        else:
            await pump_sim.start()
            started.append(pump_id)

    _logger.info(f"Started {len(started)} pumps via API")

    return {
        "message": f"Started {len(started)} pumps",
        "started": started,
        "skipped": skipped,
        "success": True
    }


@app.post("/api/pumps/stop-all", tags=["Pumps"])
async def stop_all_pumps():
    """Stop all pumps."""
    engine = get_engine()
    if not engine:
        raise HTTPException(
            status_code=503,
            detail="Simulation engine not available. Ensure server is running with --with-api flag."
        )

    stopped = []
    skipped = []

    for pump_id, pump_sim in engine.pumps.items():
        if not pump_sim.is_running:
            skipped.append({"id": pump_id, "reason": "already_stopped"})
        else:
            await pump_sim.stop()
            stopped.append(pump_id)

    _logger.info(f"Stopped {len(stopped)} pumps via API")

    return {
        "message": f"Stopped {len(stopped)} pumps",
        "stopped": stopped,
        "skipped": skipped,
        "success": True
    }


# =============================================================================
# WEBSOCKET ENDPOINTS
# =============================================================================

@app.websocket("/ws/pumps")
async def websocket_pumps(websocket: WebSocket):
    """WebSocket endpoint for real-time pump data streaming."""
    await ws_manager.connect(websocket)
    try:
        while True:
            # Keep connection alive and handle any incoming messages
            data = await websocket.receive_text()
            # Could handle commands here if needed (e.g., start/stop pump)
            _logger.debug(f"Received WebSocket message: {data}")
    except WebSocketDisconnect:
        await ws_manager.disconnect(websocket)
    except Exception as e:
        _logger.warning(f"WebSocket error: {e}")
        await ws_manager.disconnect(websocket)


# =============================================================================
# HEALTH CHECK
# =============================================================================

@app.get("/api/health", tags=["Health"])
async def health_check():
    """Health check endpoint."""
    state = db.get_server_state() if db else {}
    assets = db.get_assets() if db else []

    pump_count = len([a for a in assets if a.get('type_name') in ('PumpType', 'InfluentPumpType')])
    chamber_count = len([a for a in assets if a.get('type_name') == 'ChamberType'])

    is_running = state.get('status') == 'running'
    
    # Check PubSub status
    engine = get_engine()
    pubsub_running = False
    if engine and hasattr(engine, 'pubsub_manager') and engine.pubsub_manager:
        pubsub_running = engine.pubsub_manager.is_running

    return {
        "status": "healthy" if db and is_running else "degraded" if db else "unhealthy",
        "opcua_server": is_running,
        "database": db is not None,
        "simulation_running": is_running,
        "pubsub_status": pubsub_running,
        "pump_count": pump_count,
        "chamber_count": chamber_count,
        "timestamp": datetime.utcnow().isoformat()
    }


# =============================================================================
# MAIN
# =============================================================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)
