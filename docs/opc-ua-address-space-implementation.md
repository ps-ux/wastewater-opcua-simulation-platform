# OPC-UA Address Space Implementation

This document describes how the OPC-UA address space is implemented using `types.yaml` and `assets.json` configuration files, and how the dashboard UI under the `ui/` folder displays this information.

---

## Table of Contents

1. [Overview](#overview)
2. [Type Definitions (types.yaml)](#type-definitions-typesyaml)
3. [Asset Instances (assets.json)](#asset-instances-assetsjson)
4. [Server-Side Address Space Creation](#server-side-address-space-creation)
5. [Dashboard UI Implementation](#dashboard-ui-implementation)
   - [Types Page Implementation](#types-page-implementation)
   - [Assets Page Implementation](#assets-page-implementation)
6. [Data Flow Architecture](#data-flow-architecture)

---

## Overview

The OPC-UA address space is built using a two-file configuration approach:

| File | Purpose |
|------|---------|
| `types.yaml` | Defines reusable **ObjectTypes** (like classes in OOP) |
| `assets.json` | Defines **asset instances** created from those types |

This separation follows the OPC-UA information modeling best practice where types are defined once and instantiated multiple times.

```
┌─────────────────┐     ┌─────────────────┐
│   types.yaml    │     │   assets.json   │
│  (Type Defs)    │     │  (Instances)    │
└────────┬────────┘     └────────┬────────┘
         │                       │
         ▼                       ▼
┌────────────────────────────────────────┐
│         OPC-UA Server (server.py)      │
│    Creates address space from config   │
└────────────────────────────────────────┘
         │
         ▼
┌────────────────────────────────────────┐
│         REST API (Python Backend)      │
│  /api/config/types-yaml                │
│  /api/config/assets-json               │
└────────────────────────────────────────┘
         │
         ▼
┌────────────────────────────────────────┐
│         Dashboard UI (Next.js)         │
│  /types - Display type definitions     │
│  /assets - Display asset instances     │
└────────────────────────────────────────┘
```

---

## Type Definitions (types.yaml)

The `types.yaml` file defines the OPC-UA ObjectTypes, custom data types, engineering units, and alarm definitions.

### File Structure

```yaml
# Namespace configuration
namespace: 1
namespaceUri: "http://cleanwaterservices.org/opcua"

# Engineering units (UNECE codes)
engineeringUnits:
  cubicMetersPerHour: { displayName: "m³/h", unitId: 4403510 }
  revolutionsPerMinute: { displayName: "rpm", unitId: 4403766 }
  # ... more units

# Custom data types
dataTypes:
  SimulationModeEnumeration:
    type: Enumeration
    values: { OPTIMAL: 0, AGED: 1, DEGRADED: 2, FAILURE: 3 }
  OperatingPointDataType:
    type: Structure
    fields: { Flow: Double, Head: Double, ... }

# ObjectType definitions
types:
  AssetType: { ... }
  PumpType: { ... }
  InfluentPumpType: { ... }
  ChamberType: { ... }
  SimulationConfigType: { ... }

# Alarm definitions
alarmTypes:
  HighVibrationAlarm: { ... }
  HighBearingTempAlarm: { ... }
```

### Type Inheritance Hierarchy

```
BaseObjectType (OPC-UA Standard)
├── AssetType (abstract - base for all plant assets)
│   ├── PumpType (centrifugal pump with 27 data points)
│   │   └── InfluentPumpType (extends PumpType + WetWellLevel)
│   └── ChamberType (tanks, channels, clarifiers)
└── SimulationConfigType (simulation control)
```

### PumpType Component Categories

The `PumpType` defines 27 data points organized by category:

| Category | Components | Count |
|----------|-----------|-------|
| Flow | FlowRate | 1 |
| Pressure | SuctionPressure, DischargePressure | 2 |
| VFD/Electrical | RPM, MotorCurrent, Voltage, PowerConsumption, PowerFactor, VFDFrequency | 6 |
| Temperature | MotorWindingTemp, BearingTemp_DE, BearingTemp_NDE, SealChamberTemp, AmbientTemp | 5 |
| Vibration | Vibration_DE_H/V/A, Vibration_NDE_H/V/A | 6 |
| Counters | RuntimeHours, StartCount | 2 |
| Discrete Status | RunCommand, RunFeedback, FaultStatus, ReadyStatus, LocalRemote | 5 |

### Component Definition Structure

Each component in `types.yaml` includes:

```yaml
FlowRate:
  type: AnalogItemType           # OPC-UA variable type
  dataType: Double               # Data type
  modellingRule: Mandatory       # Mandatory or Optional
  description: "Discharge flow rate from magnetic flow meter"
  accessLevel: Read              # Read, Write, or ReadWrite
  engineeringUnits: cubicMetersPerHour
  euRange:                       # Engineering unit range
    low: 0.0
    high: 5000.0
  instrumentRange:               # Instrument physical range
    low: 0.0
    high: 6000.0
```

### Method Definitions

Methods are callable operations on type instances:

```yaml
methods:
  StartPump:
    description: "Issue start command to pump"
    executable: true
    inputArguments: []
    outputArguments:
      - name: "Success"
        dataType: Boolean
      - name: "Message"
        dataType: String
```

---

## Asset Instances (assets.json)

The `assets.json` file defines the actual equipment instances and their hierarchical organization.

### File Structure

```json
{
  "metadata": {
    "version": "2.0",
    "description": "Wastewater treatment facility asset hierarchy",
    "patterns": [
      "Pattern 1: Full Plant Hierarchy (Plant → Process → System → Asset)",
      "Pattern 2: Standalone Pump Station (PumpStation → Asset)"
    ]
  },
  "assets": [ ... ],
  "summary": { ... }
}
```

### Hierarchy Patterns

**Pattern 1: Full Plant Hierarchy**
```
RC_RockCreek (Plant)
├── P0041_Preliminary (Process)
│   ├── S00630_InfluentPumping (System)
│   │   ├── IPS_PMP_001 (InfluentPumpType)
│   │   ├── IPS_PMP_002 (InfluentPumpType)
│   │   ├── IPS_PMP_003 (InfluentPumpType)
│   │   └── IPS_WW_001 (ChamberType)
│   ├── S00631_Screening (System)
│   └── S00629_Conveyance (System)
├── P0042_Primary (Process)
└── P0043_Secondary (Process)
```

**Pattern 2: Standalone Pump Station**
```
Riverside_PS (PumpStation)
├── RPS_PMP_001 (InfluentPumpType)
├── RPS_PMP_002 (InfluentPumpType)
└── RPS_WW_001 (ChamberType)
```

### Asset Instance Definition

Each asset in `assets.json` includes:

```json
{
  "id": "IPS_PMP_001",
  "name": "IPS_PMP_001",
  "displayName": "Influent Pump 1",
  "description": "Primary influent pump - 10-30 MGD capacity",
  "type": "InfluentPumpType",
  "hierarchyLevel": "Asset",
  "parent": "S00630",
  "simulate": true,
  "properties": {
    "AssetId": "IPS-PMP-001",
    "AssetName": "Influent Pump 1",
    "Location": "Influent Pump Station - Bay 1",
    "Manufacturer": "Flygt",
    "Model": "CP3300.900",
    "SerialNumber": "FLY-2019-78432",
    "InstallationDate": "2019-06-15T00:00:00Z"
  },
  "designSpecs": {
    "DesignFlow": 2500.0,
    "DesignHead": 15.0,
    "DesignPower": 150.0,
    "MaxRPM": 1180,
    "MinRPM": 600,
    "FullLoadAmps": 225.0,
    "RatedVoltage": 480,
    "ImpellerDiameter": 450.0,
    "NPSHRequired": 4.5,
    "ManufacturerBEP_Efficiency": 84.0,
    "MotorEfficiency": 95.4
  },
  "alarms": [
    "HighVibrationAlarm",
    "HighBearingTempAlarm",
    "OverloadAlarm",
    "CavitationAlarm"
  ]
}
```

### Key Asset Fields

| Field | Description |
|-------|-------------|
| `id` | Unique identifier (used as OPC-UA NodeId) |
| `name` | OPC-UA BrowseName |
| `displayName` | Human-readable label |
| `type` | ObjectType reference from types.yaml |
| `hierarchyLevel` | Plant, Process, System, PumpStation, or Asset |
| `parent` | Parent node ID for hierarchy |
| `simulate` | Whether simulation engine updates this asset |
| `properties` | Asset metadata (from AssetType properties) |
| `designSpecs` | Pump nameplate data (populated into DesignSpecs object) |
| `alarms` | List of alarm types configured for this asset |

---

## Server-Side Address Space Creation

The `server.py` loads both configuration files and creates the OPC-UA address space:

1. **Load types.yaml** → Create ObjectTypes in namespace
2. **Load assets.json** → Instantiate objects from types
3. **Bind simulation** → Connect PumpSim/ChamberSim to instances

```python
# Simplified flow in server.py
types_config = yaml.load('types.yaml')
assets_config = json.load('assets.json')

# Create ObjectTypes from types.yaml
for type_name, type_def in types_config['types'].items():
    create_object_type(type_name, type_def)

# Instantiate assets from assets.json
for asset in assets_config['assets']:
    create_instance(asset['type'], asset)

    if asset.get('simulate'):
        bind_simulation(asset)
```

---

## Dashboard UI Implementation

The dashboard is built with **Next.js 16** and **React 19**, using:
- **TailwindCSS** for styling
- **Zustand** for state management
- **SWR** for data fetching
- **Lucide React** for icons

### Directory Structure

```
ui/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Main dashboard
│   │   ├── types/page.tsx        # Type definitions explorer
│   │   ├── assets/page.tsx       # Asset instances browser
│   │   ├── pumps/page.tsx        # Pump control interface
│   │   ├── monitoring/page.tsx   # Real-time monitoring
│   │   └── layout.tsx            # App layout with navigation
│   ├── components/
│   │   ├── ui/                   # Reusable UI components
│   │   └── pumps/                # Pump-specific components
│   ├── stores/                   # Zustand state stores
│   ├── hooks/                    # Custom React hooks
│   └── lib/
│       ├── types.ts              # TypeScript interfaces
│       ├── api.ts                # API client
│       └── utils.ts              # Utility functions
```

---

### Types Page Implementation

**File:** `ui/src/app/types/page.tsx`

The Types page provides an interactive explorer for OPC-UA type definitions from `types.yaml`.

#### Page Structure

```
┌─────────────────────────────────────────────────────────────┐
│  Header: "OPC-UA Type Definitions"                          │
│  Subtitle: Source file reference (types.yaml)              │
├─────────────────────────────────────────────────────────────┤
│  Namespace Info Card                                        │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Namespace: http://cleanwaterservices.org/opcua      │   │
│  │ Index: 1 | 5 Types | 4 Data Types | 6 Alarms        │   │
│  └─────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│  Tab Navigation                                             │
│  [Object Types] [Data Types] [Engineering Units] [Alarms]   │
├─────────────────────────────────────────────────────────────┤
│  Main Content Area (varies by tab)                          │
└─────────────────────────────────────────────────────────────┘
```

#### Object Types Tab Layout

```
┌──────────────────────────┬──────────────────────────────────┐
│  Type Hierarchy (4 col)  │  Type Details (8 col)            │
│  ┌────────────────────┐  │  ┌──────────────────────────┐   │
│  │ BaseObjectType     │  │  │ Selected Type Header     │   │
│  │  └─AssetType       │  │  │ Name, Description, Base  │   │
│  │    ├─PumpType      │  │  └──────────────────────────┘   │
│  │    │ └─InfluentP.  │  │  ┌──────────────────────────┐   │
│  │    └─ChamberType   │  │  │ Properties Card          │   │
│  │  └─SimConfigType   │  │  │ AssetId, Location, etc.  │   │
│  └────────────────────┘  │  └──────────────────────────┘   │
│  ┌────────────────────┐  │  ┌──────────────────────────┐   │
│  │ Info Card          │  │  │ Components Card          │   │
│  │ Understanding      │  │  │ FlowRate, RPM, etc.      │   │
│  │ OPC-UA Types       │  │  │ (expandable nested)      │   │
│  └────────────────────┘  │  └──────────────────────────┘   │
│                          │  ┌──────────────────────────┐   │
│                          │  │ Methods Card             │   │
│                          │  │ StartPump(), StopPump()  │   │
│                          │  └──────────────────────────┘   │
└──────────────────────────┴──────────────────────────────────┘
```

#### Key TypeScript Interfaces

```typescript
// Type component definition
interface TypeComponent {
  name: string;
  type: string;                    // AnalogItemType, TwoStateDiscreteType, etc.
  dataType: string | null;         // Double, Boolean, String, etc.
  description: string;
  modellingRule: string;           // Mandatory | Optional
  accessLevel: string;             // Read | Write | ReadWrite
  engineeringUnits?: string;       // Reference to engineeringUnits
  euRange?: { low: number; high: number };
  instrumentRange?: { low: number; high: number };
  trueState?: string;              // For TwoStateDiscreteType
  falseState?: string;
  nestedComponents?: Record<string, TypeComponent>;  // For nested objects
}

// Method definition
interface TypeMethod {
  name: string;
  description: string;
  inputArguments: Array<{ name: string; dataType: string; description: string }>;
  outputArguments: Array<{ name: string; dataType: string; description: string }>;
}

// Complete type definition
interface TypeDefinition {
  name: string;
  base: string;                    // Parent type
  isAbstract: boolean;
  description: string;
  properties: Record<string, TypeComponent>;
  components: Record<string, TypeComponent>;
  methods: Record<string, TypeMethod>;
}
```

#### Data Fetching

```typescript
// Fetch types configuration from API
useEffect(() => {
  async function fetchConfig() {
    const res = await fetch(`${API_BASE}/api/config/types-yaml`);
    const data = await res.json();
    setConfig(data);

    // Auto-select first non-abstract type
    const firstType = Object.values(data.types)
      .find(t => !t.isAbstract);
    if (firstType) setSelectedType(firstType.name);
  }
  fetchConfig();
}, []);
```

#### Component Rendering

**TypeNode Component** - Renders type hierarchy tree:

```typescript
function TypeNode({ typeDef, allTypes, level, isSelected, onSelect }) {
  const childTypes = Object.values(allTypes).filter(t => t.base === typeDef.name);
  const [expanded, setExpanded] = useState(true);

  return (
    <div style={{ marginLeft: level * 20 }}>
      {/* Expand/collapse button if has children */}
      {/* Type icon (blue for concrete, gray for abstract) */}
      {/* Type name with "abstract" badge if applicable */}
      {expanded && childTypes.map(child => (
        <TypeNode key={child.name} typeDef={child} level={level + 1} ... />
      ))}
    </div>
  );
}
```

**ComponentPanel Component** - Renders component details with nested expansion:

```typescript
function ComponentPanel({ component }) {
  const hasNested = component.nestedComponents &&
                    Object.keys(component.nestedComponents).length > 0;

  return (
    <div className="border rounded-lg">
      {/* Header row with icon, name, type badge, data type */}
      {/* Engineering units badge if applicable */}
      {/* EU Range display [low - high] */}
      {/* True/False state for discrete types */}

      {/* Expandable nested components (e.g., DesignSpecs) */}
      {expanded && hasNested && (
        <div className="nested-content">
          {Object.values(component.nestedComponents).map(nc => (
            // Nested component display
          ))}
        </div>
      )}
    </div>
  );
}
```

#### Icon Mapping

The page uses different icons for different component types:

```typescript
function getComponentIcon(type: string) {
  switch (type) {
    case 'AnalogItemType':        return <Gauge />;      // Blue
    case 'TwoStateDiscreteType':  return <Zap />;        // Yellow
    case 'Property':              return <Hash />;       // Gray
    case 'DataItemType':          return <Database />;   // Purple
    case 'Object':                return <Box />;        // Green
    case 'Method':                return <Play />;       // Orange
    default:                      return <Type />;       // Gray
  }
}
```

---

### Assets Page Implementation

**File:** `ui/src/app/assets/page.tsx`

The Assets page provides a browser for equipment instances defined in `assets.json`.

#### Page Structure

```
┌─────────────────────────────────────────────────────────────┐
│  Header: "Asset Instances"                                  │
│  Subtitle: Source file reference (assets.json)             │
├─────────────────────────────────────────────────────────────┤
│  Summary Statistics Cards (6 columns)                       │
│  ┌────────┬────────┬────────┬────────┬────────┬────────┐   │
│  │ Plants │Process │Systems │PumpSta.│Simul.  │ Total  │   │
│  │   1    │   3    │   7    │   2    │  15    │  28    │   │
│  └────────┴────────┴────────┴────────┴────────┴────────┘   │
├─────────────────────────────────────────────────────────────┤
│  View Mode Tabs                                             │
│  [Hierarchy Tree] [By Type] [By Level]                      │
├─────────────────────────────────────────────────────────────┤
│  Main Content Area (varies by view mode)                    │
└─────────────────────────────────────────────────────────────┘
```

#### Hierarchy Tree View Layout

```
┌───────────────────────────┬─────────────────────────────────┐
│  Asset Hierarchy (5 col)  │  Asset Details (7 col)          │
│  ┌─────────────────────┐  │  ┌───────────────────────────┐  │
│  │ 🏢 RC - Rock Creek  │  │  │ Asset Header              │  │
│  │  ├─🏭 P0041 - Prel. │  │  │ Name + "Simulated" badge  │  │
│  │  │ ├─📦 S00630      │  │  │ Description               │  │
│  │  │ │ ├─💧 IPS_PMP_1 │  │  └───────────────────────────┘  │
│  │  │ │ ├─💧 IPS_PMP_2 │  │  ┌───────────────────────────┐  │
│  │  │ │ └─📦 IPS_WW_1  │  │  │ Browse Path               │  │
│  │  │ └─📦 S00631      │  │  │ Objects/RC_RockCreek/...  │  │
│  │  └─🏭 P0042 - Prim. │  │  └───────────────────────────┘  │
│  └─────────────────────┘  │  ┌───────────────────────────┐  │
│  ┌─────────────────────┐  │  │ Properties Card           │  │
│  │ Info Card           │  │  │ AssetId, Location,        │  │
│  │ OPC-UA Address      │  │  │ Manufacturer, Model...    │  │
│  │ Space explanation   │  │  └───────────────────────────┘  │
│  └─────────────────────┘  │  ┌───────────────────────────┐  │
│                           │  │ Design Specifications     │  │
│                           │  │ Grouped by category       │  │
│                           │  └───────────────────────────┘  │
│                           │  ┌───────────────────────────┐  │
│                           │  │ Configured Alarms         │  │
│                           │  │ HighVibration, Overload.. │  │
│                           │  └───────────────────────────┘  │
└───────────────────────────┴─────────────────────────────────┘
```

#### Key TypeScript Interfaces

```typescript
// Asset node in hierarchy tree
interface AssetNode {
  id: string;
  name: string;
  displayName: string;
  type: string;                    // InfluentPumpType, PumpType, ChamberType, Folder
  parent: string;                  // Parent node ID
  description: string;
  hierarchyLevel: string;          // Plant, Process, System, PumpStation, Asset
  simulate: boolean;               // Whether simulation updates this asset
  properties: Record<string, unknown>;   // Asset metadata
  designSpecs: Record<string, number>;   // Pump nameplate data
  alarms: string[];                // Configured alarm names
  children?: AssetNode[];          // For tree display
}

// API response structure
interface AssetsConfig {
  metadata: { version, description, patterns };
  summary: {
    totalAssets: number;
    hierarchy: { plants, processes, systems, pumpStations };
    assetsByType: Record<string, number>;
    simulatedAssets: number;
  };
  tree: AssetNode[];               // Pre-built hierarchy tree
  assets: AssetNode[];             // Flat list of all assets
  assetsByType: Record<string, AssetNode[]>;   // Grouped by type
  assetsByLevel: Record<string, AssetNode[]>;  // Grouped by level
}
```

#### Tree Node Component

```typescript
function AssetTreeNode({ node, level, selectedId, onSelect, expandedIds, onToggle }) {
  const hasChildren = node.children && node.children.length > 0;
  const isExpanded = expandedIds.has(node.id);

  return (
    <div>
      <div style={{ marginLeft: level * 16 }} onClick={() => onSelect(node.id)}>
        {/* Expand/collapse button */}
        {/* Hierarchy icon (Building2, Factory, Layers, etc.) */}
        {/* Display name */}
        {/* Simulation indicator (Activity icon if simulate=true) */}
        {/* Type badge (color-coded) */}
      </div>
      {isExpanded && hasChildren && node.children.map(child => (
        <AssetTreeNode key={child.id} node={child} level={level + 1} ... />
      ))}
    </div>
  );
}
```

#### Hierarchy Icon Mapping

```typescript
function getHierarchyIcon(level: string, type: string) {
  if (type === 'Folder') {
    switch (level) {
      case 'Plant':       return <Building2 />;  // Indigo
      case 'Process':     return <Factory />;    // Blue
      case 'System':      return <Layers />;     // Cyan
      case 'PumpStation': return <Server />;     // Purple
    }
  }
  // Asset types
  switch (type) {
    case 'InfluentPumpType':   return <Droplets />;   // Blue
    case 'PumpType':           return <Gauge />;      // Green
    case 'ChamberType':        return <Box />;        // Amber
    case 'SimulationConfigType': return <Settings />; // Gray
  }
}
```

#### Browse Path Component

Displays the OPC-UA address space path to the selected asset:

```typescript
function BrowsePath({ asset, allAssets }) {
  const pathParts: AssetNode[] = [];
  let current = asset;

  // Build path from asset to root
  while (current) {
    pathParts.unshift(current);
    const parent = allAssets.find(a => a.id === current.parent);
    if (!parent) break;
    current = parent;
  }

  return (
    <div className="flex items-center gap-1">
      <span>Objects</span>
      {pathParts.map((node, i) => (
        <>
          <ChevronRight />
          <span>{node.name}</span>
        </>
      ))}
    </div>
  );
}
// Example output: Objects > RC_RockCreek > P0041_Preliminary > S00630 > IPS_PMP_001
```

#### Design Specifications Display

Groups pump design specs by category:

```typescript
function DesignSpecsPanel({ specs }) {
  const specGroups = {
    'Flow & Pressure': ['DesignFlow', 'DesignHead', 'NPSHRequired'],
    'Motor': ['DesignPower', 'MaxRPM', 'MinRPM', 'FullLoadAmps', 'RatedVoltage'],
    'Efficiency': ['ManufacturerBEP_Efficiency', 'MotorEfficiency'],
    'Physical': ['ImpellerDiameter'],
  };

  const units = {
    DesignFlow: 'm³/h',
    DesignHead: 'm',
    DesignPower: 'kW',
    // ... etc
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      {Object.entries(specGroups).map(([group, keys]) => (
        <div key={group}>
          <h4>{group}</h4>
          {keys.filter(k => specs[k] !== undefined).map(key => (
            <div>
              <span>{key}</span>
              <span>{specs[key]} {units[key]}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
```

#### Alternative Views

**By Type View** - Groups assets by ObjectType:
- InfluentPumpType (7 assets)
- PumpType (4 assets)
- ChamberType (7 assets)
- Folder (9 hierarchy nodes)

**By Level View** - Groups by hierarchy level:
- Plant (1)
- Process (3)
- System (7)
- PumpStation (2)
- Asset (15)

---

## Data Flow Architecture

### API Endpoints

The Python backend exposes REST endpoints for the UI:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/config/types-yaml` | GET | Parsed types.yaml with processed inheritance |
| `/api/config/assets-json` | GET | Parsed assets.json with built tree structure |
| `/api/pumps` | GET | Real-time pump status from OPC-UA server |
| `/api/pumps/{id}/start` | POST | Call StartPump method |
| `/api/pumps/{id}/stop` | POST | Call StopPump method |

### Backend Processing

The backend transforms raw YAML/JSON into enriched structures:

**types-yaml endpoint:**
- Parses YAML file
- Builds inheritance map
- Resolves parent references
- Groups components by category

**assets-json endpoint:**
- Parses JSON file
- Builds parent-child tree structure
- Groups assets by type
- Groups assets by hierarchy level
- Calculates summary statistics

### Frontend State Management

```typescript
// Types page state
const [config, setConfig] = useState<TypesConfig | null>(null);
const [selectedType, setSelectedType] = useState<string | null>(null);
const [activeTab, setActiveTab] = useState<'types' | 'dataTypes' | 'units' | 'alarms'>('types');

// Assets page state
const [config, setConfig] = useState<AssetsConfig | null>(null);
const [selectedId, setSelectedId] = useState<string | null>(null);
const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
const [viewMode, setViewMode] = useState<'tree' | 'byType' | 'byLevel'>('tree');
```

---

## Summary

| Aspect | types.yaml | assets.json |
|--------|-----------|-------------|
| Purpose | Define reusable types | Create instances |
| OPC-UA Concept | ObjectTypes | Object instances |
| Analogy | Class definitions | Object instantiation |
| UI Page | `/types` | `/assets` |
| Primary View | Inheritance tree | Hierarchy tree |
| Secondary Views | Data types, Units, Alarms | By Type, By Level |
| Key Components | Components, Methods, Properties | Properties, DesignSpecs, Alarms |

The separation of type definitions and asset instances provides:
1. **Reusability** - One type definition, multiple instances
2. **Consistency** - All pumps have the same data points
3. **Maintainability** - Change type definition, all instances updated
4. **Scalability** - Easy to add new facilities/equipment
