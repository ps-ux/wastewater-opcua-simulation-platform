"""OPC-UA Asset Builder.

Instantiates assets from assets.json configuration using types defined in types.yaml.
Builds the complete asset hierarchy (Plant -> Process -> System -> Asset).
"""

import logging
from typing import Dict, List, Any, Optional, Callable
from asyncua import Server, ua
from config.loader import ConfigLoader, AssetDef, TypeDef

_logger = logging.getLogger('opcua.asset_builder')


class AssetBuilder:
    """Builds OPC-UA asset instances from configuration."""

    def __init__(self, server: Server, config: ConfigLoader, type_nodes: Dict[str, Any], idx: int):
        self.server = server
        self.config = config
        self.type_nodes = type_nodes
        self.idx = idx
        self.node_map: Dict[str, Any] = {'ObjectsFolder': server.nodes.objects}
        self.simulation_targets: List[Dict] = []  # Assets that need simulation binding

    async def build_all_assets(self) -> Dict[str, Any]:
        """Build all asset instances from configuration."""
        asset_defs = self.config.get_asset_definitions()
        type_defs = self.config.get_type_definitions()

        # Process assets in multiple passes to handle parent dependencies
        pending = asset_defs.copy()
        max_passes = 10
        passes = 0

        while pending and passes < max_passes:
            remaining = []
            progress = False

            for asset_def in pending:
                if asset_def.parent in self.node_map:
                    await self._build_asset(asset_def, type_defs)
                    progress = True
                else:
                    remaining.append(asset_def)

            pending = remaining
            passes += 1

            if not progress and pending:
                missing_parents = set(a.parent for a in pending)
                _logger.error(f"Cannot resolve parents: {missing_parents}")
                break

        _logger.info(f"Built {len(self.node_map) - 1} assets in {passes} passes")
        return self.node_map

    async def _build_asset(self, asset_def: AssetDef, type_defs: Dict[str, TypeDef]) -> Any:
        """Build a single asset instance."""
        parent_node = self.node_map[asset_def.parent]

        if asset_def.asset_type == 'Folder':
            # Create folder
            node = await parent_node.add_folder(self.idx, asset_def.name)
            _logger.debug(f"Created folder: {asset_def.name}")

        elif asset_def.asset_type in self.type_nodes:
            # Instantiate from type
            type_node = self.type_nodes[asset_def.asset_type]
            node = await parent_node.add_object(self.idx, asset_def.name, objecttype=type_node.nodeid)

            # Get type definition for manual component building
            type_def = type_defs.get(asset_def.asset_type)
            if type_def:
                await self._build_instance_components(node, type_def, type_defs)

            # Apply properties
            if asset_def.properties:
                await self._apply_properties(node, asset_def.properties)

            # Apply design specs
            if asset_def.design_specs:
                await self._apply_design_specs(node, asset_def.design_specs)

            # Track for simulation binding
            if asset_def.simulate:
                self.simulation_targets.append({
                    'id': asset_def.id,
                    'name': asset_def.name,
                    'type': asset_def.asset_type,
                    'node': node,
                    'design_specs': asset_def.design_specs
                })

            _logger.debug(f"Created {asset_def.asset_type}: {asset_def.name}")

        else:
            _logger.warning(f"Unknown type {asset_def.asset_type} for asset {asset_def.name}")
            return None

        self.node_map[asset_def.id] = node
        return node

    async def _build_instance_components(self, node: Any, type_def: TypeDef,
                                          type_defs: Dict[str, TypeDef]) -> None:
        """Manually build instance components from type definition.

        asyncua doesn't always instantiate all components from ObjectType,
        so we need to build them manually.
        """
        # Include inherited components
        all_components = {}
        all_properties = {}
        all_methods = {}

        # Walk inheritance chain
        current_type = type_def
        while current_type:
            # Merge (child overrides parent)
            for name, comp in current_type.components.items():
                if name not in all_components:
                    all_components[name] = comp
            for name, prop in current_type.properties.items():
                if name not in all_properties:
                    all_properties[name] = prop
            for name, method in current_type.methods.items():
                if name not in all_methods:
                    all_methods[name] = method

            # Get parent type
            if current_type.base and current_type.base != 'BaseObjectType':
                current_type = type_defs.get(current_type.base)
            else:
                break

        # Build properties
        from opcua.type_builder import TypeBuilder
        for prop_name, prop_def in all_properties.items():
            await self._ensure_component(node, prop_name, prop_def)

        # Build components
        for comp_name, comp_def in all_components.items():
            await self._ensure_component(node, comp_name, comp_def)

        # Build methods
        for method_name, method_def in all_methods.items():
            await self._ensure_method(node, method_name, method_def)

    async def _ensure_component(self, parent: Any, name: str, comp_def: Any) -> Optional[Any]:
        """Ensure a component exists on an instance, creating if needed."""
        # Check if already exists
        children = await parent.get_children()
        for child in children:
            bn = await child.read_browse_name()
            if bn.Name == name:
                # Already exists, maybe add nested components
                if comp_def.component_type == 'Object' and comp_def.components:
                    for nested_name, nested_def in comp_def.components.items():
                        await self._ensure_component(child, nested_name, nested_def)
                return child

        # Create component
        from opcua.type_builder import TypeBuilder
        variant_type = TypeBuilder.DATA_TYPE_MAP.get(comp_def.data_type, ua.VariantType.String)
        initial_value = comp_def.value if comp_def.value is not None else self._get_default(variant_type)

        try:
            node = None

            if comp_def.component_type == 'Property':
                node = await parent.add_property(self.idx, name, initial_value, varianttype=variant_type)

            elif comp_def.component_type == 'Object':
                node = await parent.add_object(self.idx, name)
                for nested_name, nested_def in comp_def.components.items():
                    await self._ensure_component(node, nested_name, nested_def)

            elif comp_def.component_type in ('AnalogItemType', 'DataItemType'):
                node = await parent.add_variable(self.idx, name, initial_value, varianttype=variant_type)
                # Add EURange
                if comp_def.eu_range:
                    eu_range = ua.Range(Low=comp_def.eu_range.low, High=comp_def.eu_range.high)
                    await node.add_property(self.idx, "EURange", eu_range)

            elif comp_def.component_type == 'TwoStateDiscreteType':
                node = await parent.add_variable(self.idx, name, False, varianttype=ua.VariantType.Boolean)
                if comp_def.true_state:
                    await node.add_property(self.idx, "TrueState", ua.LocalizedText(comp_def.true_state))
                if comp_def.false_state:
                    await node.add_property(self.idx, "FalseState", ua.LocalizedText(comp_def.false_state))
                if comp_def.access_level == 'ReadWrite':
                    await node.set_writable()

            else:
                node = await parent.add_variable(self.idx, name, initial_value, varianttype=variant_type)

            return node

        except Exception as e:
            _logger.debug(f"Could not create {name}: {e}")
            return None

    async def _ensure_method(self, parent: Any, name: str, method_def: Any) -> Optional[Any]:
        """Ensure a method exists on an instance."""
        # Check if already exists
        children = await parent.get_children()
        for child in children:
            bn = await child.read_browse_name()
            if bn.Name == name:
                return child

        # Create method with placeholder
        from opcua.type_builder import TypeBuilder

        input_args = []
        for arg in method_def.input_arguments:
            arg_type = TypeBuilder.DATA_TYPE_MAP.get(arg.get('dataType', 'String'), ua.VariantType.String)
            input_args.append(ua.Argument(
                Name=arg.get('name', ''),
                DataType=ua.NodeId(arg_type.value, 0),
                ValueRank=-1,
                Description=ua.LocalizedText(arg.get('description', ''))
            ))

        output_args = []
        for arg in method_def.output_arguments:
            arg_type = TypeBuilder.DATA_TYPE_MAP.get(arg.get('dataType', 'String'), ua.VariantType.String)
            output_args.append(ua.Argument(
                Name=arg.get('name', ''),
                DataType=ua.NodeId(arg_type.value, 0),
                ValueRank=-1,
                Description=ua.LocalizedText(arg.get('description', ''))
            ))

        async def placeholder(parent, *args):
            return []

        try:
            method_node = await parent.add_method(self.idx, name, placeholder, input_args, output_args)
            return method_node
        except Exception as e:
            _logger.debug(f"Could not create method {name}: {e}")
            return None

    async def _apply_properties(self, node: Any, properties: Dict[str, Any]) -> None:
        """Apply property values to an instance."""
        children = await node.get_children()
        child_map = {}
        for child in children:
            bn = await child.read_browse_name()
            child_map[bn.Name] = child

        for prop_name, prop_value in properties.items():
            if prop_name in child_map:
                try:
                    await child_map[prop_name].write_value(prop_value)
                except Exception as e:
                    _logger.debug(f"Could not set property {prop_name}: {e}")

    async def _apply_design_specs(self, node: Any, specs: Dict[str, Any]) -> None:
        """Apply design specifications to a pump instance."""
        # Find DesignSpecs object
        children = await node.get_children()
        design_specs_node = None

        for child in children:
            bn = await child.read_browse_name()
            if bn.Name == 'DesignSpecs':
                design_specs_node = child
                break

        if not design_specs_node:
            _logger.debug(f"DesignSpecs not found on {node}")
            return

        # Get children of DesignSpecs
        spec_children = await design_specs_node.get_children()
        spec_map = {}
        for child in spec_children:
            bn = await child.read_browse_name()
            spec_map[bn.Name] = child

        # Apply values
        for spec_name, spec_value in specs.items():
            if spec_name in spec_map:
                try:
                    # Determine correct variant type
                    if isinstance(spec_value, int):
                        await spec_map[spec_name].write_value(spec_value, varianttype=ua.VariantType.UInt32)
                    elif isinstance(spec_value, float):
                        await spec_map[spec_name].write_value(spec_value, varianttype=ua.VariantType.Double)
                    else:
                        await spec_map[spec_name].write_value(spec_value)
                except Exception as e:
                    _logger.debug(f"Could not set spec {spec_name}: {e}")

    def _get_default(self, variant_type: ua.VariantType) -> Any:
        """Get default value for variant type."""
        defaults = {
            ua.VariantType.Double: 0.0,
            ua.VariantType.Float: 0.0,
            ua.VariantType.Int32: 0,
            ua.VariantType.UInt32: 0,
            ua.VariantType.Boolean: False,
            ua.VariantType.String: "",
        }
        return defaults.get(variant_type, None)

    def get_simulation_targets(self) -> List[Dict]:
        """Get list of assets that need simulation binding."""
        return self.simulation_targets

    def get_node(self, asset_id: str) -> Optional[Any]:
        """Get a node by asset ID."""
        return self.node_map.get(asset_id)
