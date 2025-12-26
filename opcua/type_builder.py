"""OPC-UA Type Builder.

Creates OPC-UA ObjectTypes from types.yaml configuration.
Supports AnalogItemType, TwoStateDiscreteType, Properties, Objects, and Methods.
"""

import logging
from typing import Dict, Optional, Any
from asyncua import Server, ua
from config.loader import ConfigLoader, TypeDef, ComponentDef, EngineeringUnit

_logger = logging.getLogger('opcua.type_builder')


class TypeBuilder:
    """Builds OPC-UA ObjectTypes from configuration."""

    # Data type mapping
    DATA_TYPE_MAP = {
        'Double': ua.VariantType.Double,
        'Float': ua.VariantType.Double,  # Use Double for better precision
        'UInt32': ua.VariantType.UInt32,
        'UInt16': ua.VariantType.UInt16,
        'Int32': ua.VariantType.Int32,
        'Int16': ua.VariantType.Int16,
        'String': ua.VariantType.String,
        'Boolean': ua.VariantType.Boolean,
        'DateTime': ua.VariantType.DateTime,
        'ByteString': ua.VariantType.ByteString,
        # Custom enumerations treated as Int32
        'SimulationModeEnumeration': ua.VariantType.Int32,
        'FailureTypeEnumeration': ua.VariantType.Int32,
    }

    def __init__(self, server: Server, config: ConfigLoader):
        self.server = server
        self.config = config
        self.idx: int = 0
        self.type_nodes: Dict[str, Any] = {}
        self.engineering_units: Dict[str, EngineeringUnit] = {}

    async def initialize(self) -> int:
        """Initialize namespace and load engineering units."""
        namespace_uri = self.config.get_namespace_uri()
        self.idx = await self.server.register_namespace(namespace_uri)
        self.engineering_units = self.config.get_engineering_units()
        _logger.info(f"Registered namespace '{namespace_uri}' with index {self.idx}")
        return self.idx

    async def build_all_types(self) -> Dict[str, Any]:
        """Build all ObjectTypes from configuration."""
        type_defs = self.config.get_type_definitions()

        # Build types in dependency order
        # AssetType first, then PumpType, then InfluentPumpType, etc.
        build_order = ['AssetType', 'PumpType', 'InfluentPumpType', 'ChamberType', 'SimulationConfigType']

        for type_name in build_order:
            if type_name in type_defs:
                await self._build_type(type_name, type_defs[type_name])

        # Build any remaining types not in explicit order
        for type_name, type_def in type_defs.items():
            if type_name not in self.type_nodes:
                await self._build_type(type_name, type_def)

        _logger.info(f"Built {len(self.type_nodes)} ObjectTypes")
        return self.type_nodes

    async def _build_type(self, name: str, type_def: TypeDef) -> Any:
        """Build a single ObjectType."""
        if name in self.type_nodes:
            return self.type_nodes[name]

        # Get parent type
        parent_type = self.server.nodes.base_object_type
        if type_def.base != 'BaseObjectType' and type_def.base in self.type_nodes:
            parent_type = self.type_nodes[type_def.base]

        # Create ObjectType
        object_type = await parent_type.add_object_type(self.idx, name)
        self.type_nodes[name] = object_type
        _logger.debug(f"Created ObjectType: {name}")

        # Add properties
        for prop_name, prop_def in type_def.properties.items():
            await self._add_component(object_type, prop_name, prop_def)

        # Add components (variables, objects)
        for comp_name, comp_def in type_def.components.items():
            await self._add_component(object_type, comp_name, comp_def)

        # Add methods
        for method_name, method_def in type_def.methods.items():
            await self._add_method(object_type, method_name, method_def)

        return object_type

    async def _add_component(self, parent: Any, name: str, comp_def: ComponentDef) -> Optional[Any]:
        """Add a component (variable, property, or object) to a type."""
        try:
            node = None
            variant_type = self.DATA_TYPE_MAP.get(comp_def.data_type, ua.VariantType.String)
            initial_value = comp_def.value if comp_def.value is not None else self._get_default_value(variant_type)

            if comp_def.component_type == 'Property':
                node = await parent.add_property(self.idx, name, initial_value, varianttype=variant_type)

            elif comp_def.component_type == 'Object':
                node = await parent.add_object(self.idx, name)
                # Add nested components
                for nested_name, nested_def in comp_def.components.items():
                    await self._add_component(node, nested_name, nested_def)

            elif comp_def.component_type in ('AnalogItemType', 'DataItemType'):
                node = await self._add_analog_variable(parent, name, comp_def, variant_type, initial_value)

            elif comp_def.component_type == 'TwoStateDiscreteType':
                node = await self._add_two_state_discrete(parent, name, comp_def)

            else:
                # Default to variable
                node = await parent.add_variable(self.idx, name, initial_value, varianttype=variant_type)

            # Set modelling rule
            if node and comp_def.modelling_rule:
                is_mandatory = comp_def.modelling_rule == 'Mandatory'
                await node.set_modelling_rule(is_mandatory)

            return node

        except Exception as e:
            _logger.warning(f"Failed to add component {name}: {e}")
            return None

    async def _add_analog_variable(self, parent: Any, name: str, comp_def: ComponentDef,
                                    variant_type: ua.VariantType, initial_value: Any) -> Any:
        """Add an AnalogItemType variable with EURange and EngineeringUnits."""
        # Create variable
        node = await parent.add_variable(self.idx, name, initial_value, varianttype=variant_type)

        # Add EURange property
        if comp_def.eu_range:
            eu_range = ua.Range(Low=comp_def.eu_range.low, High=comp_def.eu_range.high)
            await node.add_property(self.idx, "EURange", eu_range)

        # Add InstrumentRange property
        if comp_def.instrument_range:
            inst_range = ua.Range(Low=comp_def.instrument_range.low, High=comp_def.instrument_range.high)
            await node.add_property(self.idx, "InstrumentRange", inst_range)

        # Add EngineeringUnits property
        if comp_def.engineering_units and comp_def.engineering_units in self.engineering_units:
            eu = self.engineering_units[comp_def.engineering_units]
            # Create EUInformation structure
            eu_info = ua.EUInformation(
                NamespaceUri="http://www.opcfoundation.org/UA/units/un/cefact",
                UnitId=eu.unit_id,
                DisplayName=ua.LocalizedText(eu.display_name),
                Description=ua.LocalizedText(eu.description)
            )
            await node.add_property(self.idx, "EngineeringUnits", eu_info)

        return node

    async def _add_two_state_discrete(self, parent: Any, name: str, comp_def: ComponentDef) -> Any:
        """Add a TwoStateDiscreteType variable."""
        initial_value = comp_def.value if comp_def.value is not None else False
        node = await parent.add_variable(self.idx, name, initial_value, varianttype=ua.VariantType.Boolean)

        # Add TrueState and FalseState properties
        if comp_def.true_state:
            await node.add_property(self.idx, "TrueState", ua.LocalizedText(comp_def.true_state))
        if comp_def.false_state:
            await node.add_property(self.idx, "FalseState", ua.LocalizedText(comp_def.false_state))

        # Set writable if ReadWrite
        if comp_def.access_level == 'ReadWrite':
            await node.set_writable()

        return node

    async def _add_method(self, parent: Any, name: str, method_def: ComponentDef) -> Any:
        """Add a method to a type."""
        # Build input arguments
        input_args = []
        for arg in method_def.input_arguments:
            arg_type = self.DATA_TYPE_MAP.get(arg.get('dataType', 'String'), ua.VariantType.String)
            input_args.append(ua.Argument(
                Name=arg.get('name', ''),
                DataType=ua.NodeId(arg_type.value, 0),
                ValueRank=-1,
                Description=ua.LocalizedText(arg.get('description', ''))
            ))

        # Build output arguments
        output_args = []
        for arg in method_def.output_arguments:
            arg_type = self.DATA_TYPE_MAP.get(arg.get('dataType', 'String'), ua.VariantType.String)
            output_args.append(ua.Argument(
                Name=arg.get('name', ''),
                DataType=ua.NodeId(arg_type.value, 0),
                ValueRank=-1,
                Description=ua.LocalizedText(arg.get('description', ''))
            ))

        # Create method with placeholder callback
        async def placeholder_method(parent, *args):
            _logger.warning(f"Method {name} called but not implemented")
            return []

        method_node = await parent.add_method(
            self.idx,
            name,
            placeholder_method,
            input_args,
            output_args
        )

        return method_node

    def _get_default_value(self, variant_type: ua.VariantType) -> Any:
        """Get default value for a variant type."""
        defaults = {
            ua.VariantType.Double: 0.0,
            ua.VariantType.Float: 0.0,
            ua.VariantType.Int32: 0,
            ua.VariantType.Int16: 0,
            ua.VariantType.UInt32: 0,
            ua.VariantType.UInt16: 0,
            ua.VariantType.Boolean: False,
            ua.VariantType.String: "",
        }
        return defaults.get(variant_type, None)

    def get_type_node(self, type_name: str) -> Optional[Any]:
        """Get a type node by name."""
        return self.type_nodes.get(type_name)
