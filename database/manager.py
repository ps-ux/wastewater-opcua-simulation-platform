"""Database manager for OPC-UA server.

Handles CRUD operations for types, assets, templates, and server state.
Imports default data from types.yaml and assets.json on first run.
"""

import json
import yaml
import logging
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Any, Optional
from sqlalchemy.orm import Session

from .models import (
    get_engine, get_session, create_tables,
    TypeDefinition, AssetTemplate, AssetInstance,
    ServerState, AddressSpaceConfig, SimulationRun,
    SimulationModeEnum, FailureTypeEnum, ServerStatusEnum
)

_logger = logging.getLogger('database.manager')


class DatabaseManager:
    """Manages database operations for OPC-UA server."""

    def __init__(self, db_path: str = 'config/server.db'):
        self.db_path = db_path
        self.engine = get_engine(db_path)
        self.session: Optional[Session] = None
        self._initialized = False

    def initialize(self, types_path: str = 'types.yaml', assets_path: str = 'assets.json') -> None:
        """Initialize database and import default data if needed."""
        # Ensure config directory exists
        Path(self.db_path).parent.mkdir(parents=True, exist_ok=True)

        # Create tables
        create_tables(self.engine)
        self.session = get_session(self.engine)

        # Check if already initialized
        if self.session.query(TypeDefinition).count() == 0:
            _logger.info("Importing default types from types.yaml...")
            self._import_types(types_path)

        if self.session.query(AssetInstance).count() == 0:
            _logger.info("Importing default assets from assets.json...")
            self._import_assets(assets_path)

        # Ensure server state singleton exists
        if self.session.query(ServerState).count() == 0:
            self.session.add(ServerState(id=1))
            self.session.commit()

        # Ensure default address space config exists
        if self.session.query(AddressSpaceConfig).count() == 0:
            self.session.add(AddressSpaceConfig(
                name='Default',
                description='Default address space with all assets',
                include_defaults=True,
                is_active=True
            ))
            self.session.commit()

        self._initialized = True
        _logger.info(f"Database initialized: {self.db_path}")

    def _import_types(self, types_path: str) -> None:
        """Import type definitions from types.yaml."""
        try:
            with open(types_path, 'r', encoding='utf-8') as f:
                config = yaml.safe_load(f)

            types_config = config.get('types', {})
            for name, definition in types_config.items():
                type_def = TypeDefinition(
                    name=name,
                    base_type=definition.get('base', 'BaseObjectType'),
                    is_abstract=definition.get('isAbstract', False),
                    description=definition.get('description', ''),
                    definition_json=definition,
                    is_builtin=True
                )
                self.session.add(type_def)

            self.session.commit()
            _logger.info(f"Imported {len(types_config)} type definitions")

        except Exception as e:
            _logger.error(f"Failed to import types: {e}")
            self.session.rollback()

    def _import_assets(self, assets_path: str) -> None:
        """Import asset instances from assets.json."""
        try:
            with open(assets_path, 'r', encoding='utf-8') as f:
                config = json.load(f)

            assets = config.get('assets', [])
            for asset in assets:
                # Skip comment entries
                if '$comment' in asset and 'id' not in asset:
                    continue
                if 'id' not in asset:
                    continue

                instance = AssetInstance(
                    asset_id=asset['id'],
                    name=asset['name'],
                    display_name=asset.get('displayName', asset['name']),
                    description=asset.get('description', ''),
                    type_name=asset['type'],
                    parent_id=asset.get('parent'),
                    hierarchy_level=asset.get('hierarchyLevel', ''),
                    properties_json=asset.get('properties'),
                    design_specs_json=asset.get('designSpecs'),
                    is_simulated=asset.get('simulate', False),
                    is_default=True,
                    is_enabled=True
                )
                self.session.add(instance)

                # Create template for pump types
                if asset['type'] in ('PumpType', 'InfluentPumpType') and asset.get('designSpecs'):
                    existing = self.session.query(AssetTemplate).filter_by(
                        name=f"Template_{asset['name']}"
                    ).first()
                    if not existing:
                        template = AssetTemplate(
                            name=f"Template_{asset['name']}",
                            display_name=f"{asset.get('displayName', asset['name'])} Template",
                            description=f"Template based on {asset['name']}",
                            type_name=asset['type'],
                            template_json=asset,
                            design_specs_json=asset.get('designSpecs'),
                            is_default=True,
                            is_enabled=True
                        )
                        self.session.add(template)

            self.session.commit()
            _logger.info(f"Imported {len(assets)} asset instances")

        except Exception as e:
            _logger.error(f"Failed to import assets: {e}")
            self.session.rollback()

    # =========================================================================
    # TYPE DEFINITIONS
    # =========================================================================

    def get_types(self) -> List[Dict]:
        """Get all type definitions."""
        types = self.session.query(TypeDefinition).all()
        return [t.to_dict() for t in types]

    def get_type(self, name: str) -> Optional[Dict]:
        """Get type definition by name."""
        t = self.session.query(TypeDefinition).filter_by(name=name).first()
        return t.to_dict() if t else None

    def add_type(self, name: str, base_type: str, definition: Dict,
                 description: str = '', is_abstract: bool = False) -> Dict:
        """Add a custom type definition."""
        type_def = TypeDefinition(
            name=name,
            base_type=base_type,
            is_abstract=is_abstract,
            description=description,
            definition_json=definition,
            is_builtin=False
        )
        self.session.add(type_def)
        self.session.commit()
        return type_def.to_dict()

    # =========================================================================
    # ASSET TEMPLATES
    # =========================================================================

    def get_templates(self, include_disabled: bool = False) -> List[Dict]:
        """Get all asset templates."""
        query = self.session.query(AssetTemplate)
        if not include_disabled:
            query = query.filter_by(is_enabled=True)
        templates = query.all()
        return [t.to_dict() for t in templates]

    def get_template(self, template_id: int) -> Optional[Dict]:
        """Get template by ID."""
        t = self.session.query(AssetTemplate).get(template_id)
        return t.to_dict() if t else None

    def add_template(self, name: str, type_name: str, template: Dict,
                     design_specs: Optional[Dict] = None,
                     display_name: str = '', description: str = '') -> Dict:
        """Add a custom asset template."""
        tpl = AssetTemplate(
            name=name,
            display_name=display_name or name,
            description=description,
            type_name=type_name,
            template_json=template,
            design_specs_json=design_specs,
            is_default=False,
            is_enabled=True
        )
        self.session.add(tpl)
        self.session.commit()
        return tpl.to_dict()

    def update_template(self, template_id: int, **kwargs) -> Optional[Dict]:
        """Update template."""
        tpl = self.session.query(AssetTemplate).get(template_id)
        if not tpl:
            return None

        for key, value in kwargs.items():
            if hasattr(tpl, key):
                setattr(tpl, key, value)
            elif key == 'template':
                tpl.template_json = value
            elif key == 'design_specs':
                tpl.design_specs_json = value

        self.session.commit()
        return tpl.to_dict()

    def delete_template(self, template_id: int) -> bool:
        """Delete template (only non-default)."""
        tpl = self.session.query(AssetTemplate).get(template_id)
        if not tpl or tpl.is_default:
            return False
        self.session.delete(tpl)
        self.session.commit()
        return True

    # =========================================================================
    # ASSET INSTANCES
    # =========================================================================

    def get_assets(self, include_disabled: bool = False) -> List[Dict]:
        """Get all asset instances."""
        query = self.session.query(AssetInstance)
        if not include_disabled:
            query = query.filter_by(is_enabled=True)
        assets = query.all()
        return [a.to_dict() for a in assets]

    def get_asset(self, asset_id: str) -> Optional[Dict]:
        """Get asset by ID."""
        a = self.session.query(AssetInstance).filter_by(asset_id=asset_id).first()
        return a.to_dict() if a else None

    def add_asset(self, asset_id: str, name: str, type_name: str,
                  parent_id: str, template_id: Optional[int] = None,
                  properties: Optional[Dict] = None,
                  design_specs: Optional[Dict] = None,
                  display_name: str = '', description: str = '',
                  hierarchy_level: str = 'Asset',
                  is_simulated: bool = True) -> Dict:
        """Add a custom asset instance."""
        asset = AssetInstance(
            asset_id=asset_id,
            name=name,
            display_name=display_name or name,
            description=description,
            type_name=type_name,
            parent_id=parent_id,
            hierarchy_level=hierarchy_level,
            properties_json=properties,
            design_specs_json=design_specs,
            is_simulated=is_simulated,
            is_default=False,
            is_enabled=True,
            template_id=template_id
        )
        self.session.add(asset)
        self.session.commit()
        return asset.to_dict()

    def update_asset(self, asset_id: str, **kwargs) -> Optional[Dict]:
        """Update asset."""
        asset = self.session.query(AssetInstance).filter_by(asset_id=asset_id).first()
        if not asset:
            return None

        for key, value in kwargs.items():
            if hasattr(asset, key):
                setattr(asset, key, value)
            elif key == 'properties':
                asset.properties_json = value
            elif key == 'design_specs':
                asset.design_specs_json = value

        self.session.commit()
        return asset.to_dict()

    def delete_asset(self, asset_id: str) -> bool:
        """Delete asset (only non-default)."""
        asset = self.session.query(AssetInstance).filter_by(asset_id=asset_id).first()
        if not asset or asset.is_default:
            return False
        self.session.delete(asset)
        self.session.commit()
        return True

    def toggle_asset(self, asset_id: str, enabled: bool) -> bool:
        """Enable/disable an asset."""
        asset = self.session.query(AssetInstance).filter_by(asset_id=asset_id).first()
        if not asset:
            return False
        asset.is_enabled = enabled
        self.session.commit()
        return True

    def get_asset_hierarchy(self) -> Dict:
        """Get assets as a tree structure."""
        assets = self.get_assets()
        tree = {}
        by_id = {a['asset_id']: a for a in assets}

        for asset in assets:
            parent_id = asset.get('parent_id')
            if parent_id == 'ObjectsFolder' or not parent_id:
                tree[asset['asset_id']] = {'asset': asset, 'children': {}}
            else:
                # Find parent in tree and add as child
                self._add_to_tree(tree, asset, by_id)

        return tree

    def _add_to_tree(self, tree: Dict, asset: Dict, by_id: Dict) -> None:
        """Recursively add asset to tree."""
        parent_id = asset.get('parent_id')
        if parent_id in tree:
            tree[parent_id]['children'][asset['asset_id']] = {
                'asset': asset,
                'children': {}
            }
        else:
            for key, node in tree.items():
                self._add_to_tree(node['children'], asset, by_id)

    # =========================================================================
    # SERVER STATE
    # =========================================================================

    def get_server_state(self) -> Dict:
        """Get current server state."""
        state = self.session.query(ServerState).get(1)
        if not state:
            state = ServerState(id=1)
            self.session.add(state)
            self.session.commit()
        return state.to_dict()

    def update_server_state(self, **kwargs) -> Dict:
        """Update server state."""
        state = self.session.query(ServerState).get(1)
        if not state:
            state = ServerState(id=1)
            self.session.add(state)

        for key, value in kwargs.items():
            if key == 'status' and isinstance(value, str):
                value = ServerStatusEnum(value)
            elif key == 'simulation_mode' and isinstance(value, str):
                value = SimulationModeEnum(value)
            elif key == 'failure_type' and isinstance(value, str):
                value = FailureTypeEnum(value)

            if hasattr(state, key):
                setattr(state, key, value)

        self.session.commit()
        return state.to_dict()

    def set_server_running(self, pid: Optional[int] = None) -> Dict:
        """Set server as running."""
        return self.update_server_state(
            status=ServerStatusEnum.RUNNING,
            started_at=datetime.utcnow(),
            stopped_at=None,
            error_message=None,
            pid=pid
        )

    def set_server_stopped(self, error: Optional[str] = None) -> Dict:
        """Set server as stopped."""
        return self.update_server_state(
            status=ServerStatusEnum.ERROR if error else ServerStatusEnum.STOPPED,
            stopped_at=datetime.utcnow(),
            error_message=error,
            pid=None
        )

    # =========================================================================
    # ADDRESS SPACE CONFIGS
    # =========================================================================

    def get_configs(self) -> List[Dict]:
        """Get all address space configurations."""
        configs = self.session.query(AddressSpaceConfig).all()
        return [c.to_dict() for c in configs]

    def get_active_config(self) -> Optional[Dict]:
        """Get the active configuration."""
        config = self.session.query(AddressSpaceConfig).filter_by(is_active=True).first()
        return config.to_dict() if config else None

    def set_active_config(self, config_id: int) -> bool:
        """Set a configuration as active."""
        # Deactivate all
        self.session.query(AddressSpaceConfig).update({'is_active': False})
        # Activate the selected one
        config = self.session.query(AddressSpaceConfig).get(config_id)
        if config:
            config.is_active = True
            self.session.commit()
            return True
        return False

    def add_config(self, name: str, description: str = '',
                   include_defaults: bool = True,
                   included_asset_ids: Optional[List[str]] = None,
                   excluded_asset_ids: Optional[List[str]] = None) -> Dict:
        """Add a new address space configuration."""
        config = AddressSpaceConfig(
            name=name,
            description=description,
            include_defaults=include_defaults,
            included_asset_ids=included_asset_ids or [],
            excluded_asset_ids=excluded_asset_ids or [],
            is_active=False
        )
        self.session.add(config)
        self.session.commit()
        return config.to_dict()

    # =========================================================================
    # SIMULATION RUNS
    # =========================================================================

    def start_simulation_run(self, mode: str, config_id: Optional[int] = None,
                              notes: str = '') -> int:
        """Start a new simulation run."""
        run = SimulationRun(
            started_at=datetime.utcnow(),
            mode=SimulationModeEnum(mode),
            config_id=config_id,
            notes=notes
        )
        self.session.add(run)
        self.session.commit()
        return run.id

    def end_simulation_run(self, run_id: int, runtime_hours: float = 0.0,
                           pump_starts: int = 0) -> Dict:
        """End a simulation run."""
        run = self.session.query(SimulationRun).get(run_id)
        if run:
            run.ended_at = datetime.utcnow()
            run.total_runtime_hours = runtime_hours
            run.pump_starts = pump_starts
            self.session.commit()
            return run.to_dict()
        return {}

    def get_simulation_runs(self, limit: int = 100) -> List[Dict]:
        """Get recent simulation runs."""
        runs = self.session.query(SimulationRun).order_by(
            SimulationRun.started_at.desc()
        ).limit(limit).all()
        return [r.to_dict() for r in runs]

    # =========================================================================
    # UTILITIES
    # =========================================================================

    def close(self) -> None:
        """Close database session."""
        if self.session:
            self.session.close()

    def get_enabled_assets_for_config(self, config: Optional[Dict] = None) -> List[Dict]:
        """Get list of enabled assets based on configuration."""
        if config is None:
            config = self.get_active_config()

        if not config:
            return self.get_assets()

        assets = self.get_assets()

        if not config.get('include_defaults'):
            assets = [a for a in assets if not a.get('is_default')]

        included = config.get('included_asset_ids') or []
        excluded = config.get('excluded_asset_ids') or []

        if included:
            assets = [a for a in assets if a['asset_id'] in included]

        if excluded:
            assets = [a for a in assets if a['asset_id'] not in excluded]

        return assets
