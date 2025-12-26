"""Configuration loader for OPC-UA server.

Loads type definitions from types.yaml and asset instances from assets.json.
"""

import json
import yaml
from pathlib import Path
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field


@dataclass
class EngineeringUnit:
    """UNECE engineering unit definition."""
    display_name: str
    description: str
    unit_id: int


@dataclass
class EURange:
    """Engineering unit range (operational limits)."""
    low: float
    high: float


@dataclass
class ComponentDef:
    """Component definition within a type."""
    name: str
    component_type: str  # AnalogItemType, TwoStateDiscreteType, Property, Object, Method
    data_type: Optional[str] = None
    modelling_rule: str = "Mandatory"
    description: str = ""
    access_level: str = "Read"
    engineering_units: Optional[str] = None
    eu_range: Optional[EURange] = None
    instrument_range: Optional[EURange] = None
    true_state: Optional[str] = None
    false_state: Optional[str] = None
    value: Any = None
    components: Dict[str, 'ComponentDef'] = field(default_factory=dict)
    input_arguments: List[Dict] = field(default_factory=list)
    output_arguments: List[Dict] = field(default_factory=list)


@dataclass
class TypeDef:
    """OPC-UA ObjectType definition."""
    name: str
    type_class: str  # ObjectType
    base: str
    is_abstract: bool = False
    description: str = ""
    properties: Dict[str, ComponentDef] = field(default_factory=dict)
    components: Dict[str, ComponentDef] = field(default_factory=dict)
    methods: Dict[str, ComponentDef] = field(default_factory=dict)


@dataclass
class AssetDef:
    """Asset instance definition."""
    id: str
    name: str
    display_name: str
    asset_type: str
    parent: str
    description: str = ""
    hierarchy_level: str = ""
    simulate: bool = False
    properties: Dict[str, Any] = field(default_factory=dict)
    design_specs: Dict[str, Any] = field(default_factory=dict)
    alarms: List[str] = field(default_factory=list)


@dataclass
class AlarmDef:
    """Alarm type definition."""
    name: str
    alarm_type: str
    description: str
    severity: int
    input_node: str
    high_high_limit: Optional[float] = None
    high_limit: Optional[float] = None
    low_limit: Optional[float] = None
    low_low_limit: Optional[float] = None
    message: str = ""


class ConfigLoader:
    """Loads and parses OPC-UA server configuration."""

    def __init__(self, base_path: Optional[Path] = None):
        self.base_path = base_path or Path(__file__).parent.parent
        self._types_config: Optional[Dict] = None
        self._assets_config: Optional[Dict] = None

    def load_types(self, path: Optional[str] = None) -> Dict:
        """Load raw types configuration from YAML."""
        if self._types_config is None:
            types_path = Path(path) if path else self.base_path / "types.yaml"
            with open(types_path, 'r', encoding='utf-8') as f:
                self._types_config = yaml.safe_load(f)
        return self._types_config

    def load_assets(self, path: Optional[str] = None) -> Dict:
        """Load raw assets configuration from JSON."""
        if self._assets_config is None:
            assets_path = Path(path) if path else self.base_path / "assets.json"
            with open(assets_path, 'r', encoding='utf-8') as f:
                self._assets_config = json.load(f)
        return self._assets_config

    def get_engineering_units(self) -> Dict[str, EngineeringUnit]:
        """Get engineering unit definitions."""
        config = self.load_types()
        units = {}
        for name, data in config.get('engineeringUnits', {}).items():
            units[name] = EngineeringUnit(
                display_name=data.get('displayName', ''),
                description=data.get('description', ''),
                unit_id=data.get('unitId', 0)
            )
        return units

    def get_data_types(self) -> Dict[str, Dict]:
        """Get custom data type definitions (structures, enumerations)."""
        config = self.load_types()
        return config.get('dataTypes', {})

    def get_alarm_types(self) -> Dict[str, AlarmDef]:
        """Get alarm type definitions."""
        config = self.load_types()
        alarms = {}
        for name, data in config.get('alarmTypes', {}).items():
            alarms[name] = AlarmDef(
                name=name,
                alarm_type=data.get('type', 'LimitAlarmType'),
                description=data.get('description', ''),
                severity=data.get('severity', 500),
                input_node=data.get('inputNode', ''),
                high_high_limit=data.get('highHighLimit'),
                high_limit=data.get('highLimit'),
                low_limit=data.get('lowLimit'),
                low_low_limit=data.get('lowLowLimit'),
                message=data.get('message', '')
            )
        return alarms

    def _parse_component(self, name: str, data: Dict) -> ComponentDef:
        """Parse a component definition from YAML."""
        eu_range = None
        if 'euRange' in data:
            eu_range = EURange(
                low=data['euRange'].get('low', 0.0),
                high=data['euRange'].get('high', 100.0)
            )

        instrument_range = None
        if 'instrumentRange' in data:
            instrument_range = EURange(
                low=data['instrumentRange'].get('low', 0.0),
                high=data['instrumentRange'].get('high', 100.0)
            )

        # Parse nested components
        nested_components = {}
        if 'components' in data:
            for comp_name, comp_data in data['components'].items():
                nested_components[comp_name] = self._parse_component(comp_name, comp_data)

        return ComponentDef(
            name=name,
            component_type=data.get('type', 'Property'),
            data_type=data.get('dataType'),
            modelling_rule=data.get('modellingRule', 'Mandatory'),
            description=data.get('description', ''),
            access_level=data.get('accessLevel', 'Read'),
            engineering_units=data.get('engineeringUnits'),
            eu_range=eu_range,
            instrument_range=instrument_range,
            true_state=data.get('trueState'),
            false_state=data.get('falseState'),
            value=data.get('value'),
            components=nested_components,
            input_arguments=data.get('inputArguments', []),
            output_arguments=data.get('outputArguments', [])
        )

    def get_type_definitions(self) -> Dict[str, TypeDef]:
        """Get parsed ObjectType definitions."""
        config = self.load_types()
        types = {}

        for name, data in config.get('types', {}).items():
            properties = {}
            for prop_name, prop_data in data.get('properties', {}).items():
                properties[prop_name] = self._parse_component(prop_name, prop_data)

            components = {}
            for comp_name, comp_data in data.get('components', {}).items():
                components[comp_name] = self._parse_component(comp_name, comp_data)

            methods = {}
            for method_name, method_data in data.get('methods', {}).items():
                methods[method_name] = self._parse_component(method_name, {
                    'type': 'Method',
                    **method_data
                })

            types[name] = TypeDef(
                name=name,
                type_class=data.get('type', 'ObjectType'),
                base=data.get('base', 'BaseObjectType'),
                is_abstract=data.get('isAbstract', False),
                description=data.get('description', ''),
                properties=properties,
                components=components,
                methods=methods
            )

        return types

    def get_asset_definitions(self) -> List[AssetDef]:
        """Get parsed asset instance definitions."""
        config = self.load_assets()
        assets = []

        for item in config.get('assets', []):
            # Skip comment entries
            if '$comment' in item and 'id' not in item:
                continue
            if 'id' not in item:
                continue

            assets.append(AssetDef(
                id=item['id'],
                name=item['name'],
                display_name=item.get('displayName', item['name']),
                asset_type=item['type'],
                parent=item['parent'],
                description=item.get('description', ''),
                hierarchy_level=item.get('hierarchyLevel', ''),
                simulate=item.get('simulate', False),
                properties=item.get('properties', {}),
                design_specs=item.get('designSpecs', {}),
                alarms=item.get('alarms', [])
            ))

        return assets

    def get_namespace_uri(self) -> str:
        """Get the namespace URI from types config."""
        config = self.load_types()
        return config.get('namespaceUri', 'http://opcua.example.org')


# Convenience function
def load_config(base_path: Optional[Path] = None) -> ConfigLoader:
    """Create and return a ConfigLoader instance."""
    return ConfigLoader(base_path)
