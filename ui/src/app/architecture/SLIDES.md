# OPC UA Architecture Presentation - Complete Slide Documentation

> **Total Slides:** 22
> **Estimated Duration:** 40-60 minutes
> **Theme Support:** Dark Mode & Business (Light) Mode
> **Live Features:** Real-time OPC UA server connection, pump simulation data

---

## Table of Contents

1. [Slide 1: Title](#slide-1-title)
2. [Slide 2: Agenda](#slide-2-agenda)
3. [Slide 3: Why Industrial Communication?](#slide-3-why-industrial-communication)
4. [Slide 4: Industrial Reality Before OPC UA](#slide-4-industrial-reality-before-opc-ua)
5. [Slide 5: Classic OPC vs OPC UA Evolution](#slide-5-classic-opc-vs-opc-ua-evolution)
6. [Slide 6: Address Space - Heart of OPC UA](#slide-6-address-space---heart-of-opc-ua)
7. [Slide 7: 8 NodeClasses](#slide-7-8-nodeclasses)
8. [Slide 8: From Blueprint to Reality](#slide-8-from-blueprint-to-reality)
9. [Slide 9: Communication Models Core Concepts](#slide-9-communication-models-core-concepts)
10. [Slide 10: Cross-Platform Interoperability](#slide-10-cross-platform-interoperability)
11. [Slide 11: Client-Server vs Pub/Sub Comparison](#slide-11-client-server-vs-pubsub-comparison)
12. [Slide 12: Services & Data Access](#slide-12-services--data-access)
13. [Slide 13: Purdue Model - Network Architecture](#slide-13-purdue-model---network-architecture)
14. [Slide 14: Network & Transport Protocols](#slide-14-network--transport-protocols)
15. [Slide 15: Security Architecture](#slide-15-security-architecture)
16. [Slide 16: SecureChannel vs Session](#slide-16-securechannel-vs-session)
17. [Slide 17: Role-Based Access Control](#slide-17-role-based-access-control)
18. [Slide 18: Future Directions](#slide-18-future-directions)
19. [Slide 19: Deep Dive - Communication Model](#slide-19-deep-dive---communication-model)
20. [Slide 20: Live Demo](#slide-20-live-demo)
21. [Slide 21: Key Takeaways](#slide-21-key-takeaways)
22. [Slide 22: Conclusion](#slide-22-conclusion)

---

## Slide 1: Title

**ID:** `slide-1`
**Section:** Title Slide
**Class:** `title-slide`

### Content
- **Main Title:** OPC UA Architecture
- **Subtitle:** Complete Learning & Demonstration Guide
- **Tagline:** A Practical OPC UA Client-Server Demonstration Using Rock Creek Wastewater Treatment Pump Model
- **Note:** *OPC UA is industry-agnostic — wastewater treatment is used for brevity.*

### Metadata Cards
| Label | Value |
|-------|-------|
| Spec | v1.05.06 (Oct 2025) |
| Simulation | [Dynamic] Assets Live |
| Discovery | opc.tcp://localhost:4840 |

### Visual Elements
- **Live Connection Badge:** Shows OPC UA server connection status (top-right)
- **Wastewater Treatment SVG Diagram:**
  - INFLUENT chamber with rotating pump animation
  - AERATION tank with rising bubble particles
  - CLARIFIER with settling visualization
  - SLUDGE tank (oval container)
  - EFFLUENT output with wavy line
  - Animated data packet flowing through pipeline
  - Footer: "Connected via OPC UA semantic models"

---

## Slide 2: Agenda

**ID:** `slide-2`
**Section:** PRESENTATION OVERVIEW

### Content
8 presentation topics displayed in a 2x4 grid:

| # | Title | Description | Slides |
|---|-------|-------------|--------|
| 01 | Introduction | Why OPC UA Exists & Industrial Reality | 3, 4, 5 |
| 02 | Address Space & Modeling | Information Modeling & NodeClasses | 9, 10, 16 |
| 03 | Core Concepts | Client-Server & PubSub Architectures | 7, 15, 17 |
| 04 | Services & Data Access | Browse, Read, Subscribe, Call, History | 11 |
| 05 | Network & Security | Transport, SecureChannel & RBAC | 6, 12, 8, 13, 14 |
| 06 | Future Directions | TSN, 5G, OPC UA FX & Beyond | 18 |
| 07 | Deep Dive: Communication | Message Sequence & Session Flow | 19 |
| 08 | Live Demo | Interactive Pump Control & Real-time Data | 20 |

### Interactive Features
- Click any topic to navigate to its first slide
- Hover effects with color-coded borders and glow

---

## Slide 3: Why Industrial Communication?

**ID:** `slide-3`
**Section:** SECTION 01 - THE CHALLENGE
**Badge:** FROM SIGNAL TO INSIGHT
**Goal:** Understand the data journey from physical world to enterprise decisions

### Content

#### Left Column: Data Journey Diagram (SVG)
5-layer industrial hierarchy with animated data particles:

| Level | Name | Description | Color |
|-------|------|-------------|-------|
| 5 | ENTERPRISE | ERP, Analytics, Cloud | Purple |
| 4 | SCADA/HMI | Visualization, Alarming | Pink |
| 3 | INDUSTRIAL NETWORK | OPC UA, Ethernet/IP | Orange |
| 2 | PLC/CONTROLLERS | Logic, Vendor Protocols | Cyan |
| 1 | SENSORS/I/O | 4-20mA, HART, Digital | Green |
| 0 | PHYSICAL ASSETS | Pump, Tank, Motor | Green |

- Animated particles rising through layers
- Electric signal animation lines between levels

#### Right Column: Content Cards
1. **The Core Challenge** - Industrial systems generate massive data that must travel from electrical signals to business decisions
2. **Signal Types at the Edge** - 4-20mA, 0-10V, HART, Modbus RTU
3. **What Must Happen** - Convert, Contextualize, Transport, Aggregate
4. **The Question** - "How do all these layers talk to each other?"

#### Bottom: Data Transformation Strip
Shows the journey: `Electrical Signal (12.45 mA) → Raw Value (1450) → Engineering Unit (1450 RPM) → Contextualized (Pump.Speed) → Business Insight (85% efficiency)`

---

## Slide 4: Industrial Reality Before OPC UA

**ID:** `slide-4`
**Section:** SECTION 01 - 0-5 MINUTES
**Badge:** CHAOS (with shake animation)
**Goal:** Establish why OPC UA exists

### Content

#### Left Column: Protocol Islands Diagram
"Tower of Babel" visualization showing 6 isolated protocol islands:

| Protocol | Vendor | Color |
|----------|--------|-------|
| S7 | Siemens | Cyan |
| EtherNet/IP | Rockwell | Red |
| Modbus | Modicon | Orange |
| Profibus | DIN/ISO | Purple |
| DeviceNet | ODVA | Pink |
| BACnet | ASHRAE | Blue |

- Floating animation effect
- Question marks pulsing on each island
- Broken connection lines with X marks
- Caption: "Every vendor spoke a different language"

#### Right Column: Content Cards
1. **Historical Challenges:**
   - Vendor lock-in (each PLC spoke its own language)
   - Proprietary protocols (undocumented & closed source)
   - Flat tag lists (no semantics or context)
   - No security (added externally, if at all)

2. **Wastewater Reality - Cryptic Code:**
   ```
   // PLC 1 (Siemens S7-1500)
   DB12.DBW34 = 1450  ← ???

   // PLC 2 (Allen-Bradley)
   N7:42 = 75.3  ← Tank level? RPM?

   // PLC 3 (Modbus)
   40001 = 0x05A4  ← No documentation!
   ```

#### Bottom: Summary Icons
- Vendor Lock-in
- No Standards
- Integration Hell
- Zero Security

---

## Slide 5: Classic OPC vs OPC UA Evolution

**ID:** `slide-5`
**Section:** SECTION 01 - EVOLUTION
**Badge:** 30 YEARS OF PROGRESS
**Goal:** Understand the journey from proprietary to universal

### Content

#### Timeline (Animated SVG)
| Year | Event | Status |
|------|-------|--------|
| 1996 | OPC DA (Data Access) | Legacy |
| 1998 | OPC HDA (Historical) | Legacy |
| 2000 | OPC A&E (Alarms & Events) | Legacy |
| 2006 | UA Development Started | Transition |
| 2008 | UA 1.0 Released | Current |
| 2018 | PubSub (Part 14) | Current |
| 2024 | UA 1.05 (Cloud) | Current |

#### Comparison Cards

**Classic OPC (1996-2006)** - LEGACY
| Feature | Status |
|---------|--------|
| Windows + DCOM only | ✗ |
| No encryption | ✗ |
| Firewall nightmare | ✗ |
| Data only, no context | ✗ |
| Separate specs | ✗ |

**OPC UA (2008-Present)** - CURRENT
| Feature | Status |
|---------|--------|
| Platform independent | ✓ |
| Security built-in (X.509) | ✓ |
| Firewall friendly (single port) | ✓ |
| Rich information modeling | ✓ |
| Unified spec | ✓ |

#### Bottom Banner
"OPC UA is a Platform, Not Just a Protocol"
- Communication Protocol
- Information Modeling
- Security Framework
- Scalable Architecture

---

## Slide 6: Address Space - Heart of OPC UA

**ID:** `slide-6`
**Section:** SECTION 02 - 12-22 MINUTES
**Goal:** Explain semantics and structure

### Content

#### Two-Column Comparison

**NOT Flat Tags (Legacy):**
```
HR_40001 = 1450
HR_40002 = 75.3
// If documentation is lost, meaning is lost
```

**Graph of Nodes (OPC UA):**
```
Pump_01 (Instance of PumpType)
 ├─ Speed = 1450 RPM
 ├─ Status = Running
 └─ Power = 12.4 kW
```
*Live data from simulation*

#### Two-Column Diagram Section

**Left: Hierarchical Reference Model (SVG)**
- Root Objects node (cyan circle)
- Pump_1 and Pump_2 nodes (green)
- FlowRate variables (orange)
- Reference type badges: Organizes, HasComponent, HasTypeDefinition

**Right: Namespace & NodeId**
- **NodeId Structure:** `ns=1;s=IPS_PMP_001`
  - `ns=1` = Namespace Index (orange)
  - `s=IPS_PMP_001` = String Identifier (cyan)

- **Identifier Types (4 formats):**
  | Prefix | Type | Example |
  |--------|------|---------|
  | i= | Numeric | i=2258 |
  | s= | String | s=Pump_01 |
  | g= | GUID | g=09f8... |
  | b= | Opaque | b=M/RG... |

- **NamespaceArray:**
  | Index | URI | Description |
  |-------|-----|-------------|
  | [0] | http://opcfoundation.org/UA/ | OPC UA Base |
  | [1] | urn:wastewater:server | Application |

#### Highlight Box
Address Space is a graph where Nodes are linked by References. Each Node has a globally unique NodeId = NamespaceIndex + Identifier. Index 0 is reserved for OPC UA base types.

---

## Slide 7: 8 NodeClasses

**ID:** `slide-7`
**Section:** SECTION 02 - NODECLASSES
**Reference:** OPC 10000-3

### Content

#### NodeClass Grid (4x2)

| NodeClass | Category | Description | Example |
|-----------|----------|-------------|---------|
| **Object** | Instance | Container for variables, methods, and other objects | Pump_01 |
| **Variable** | Instance | Holds data values with DataType and AccessLevel | FlowRate = 2340.5 |
| **Method** | Instance | Callable function with input/output arguments | StartPump() |
| **ObjectType** | Type | Template defining structure for Objects | PumpType |
| **VariableType** | Type | Template for Variable nodes | AnalogItemType |
| **ReferenceType** | Meta | Defines relationships between nodes | HasComponent |
| **DataType** | Meta | Defines value types (Int32, String, etc.) | Double, Boolean |
| **View** | Meta | Filtered subset of Address Space | OperatorView |

#### Type Hierarchy Diagram (SVG)
Flow: `BaseObjectType → AssetType → PumpType/ChamberType → InfluentPumpType → IPS_PMP_001`

- Navigable link to `/types` page
- Live instance data display (Running status, RPM, Power)

#### Highlight Box
**PumpType (ObjectType)** defines: 27 Variables, 4 Methods (Start, Stop, SetSpeed, Reset), and 6 Alarm conditions

---

## Slide 8: From Blueprint to Reality

**ID:** `slide-8`
**Section:** SECTION 02 - INFORMATION MODELING
**Badge:** types → OPC UA

### Content

#### Three-Column Workflow

**1. Type Definition** (types - YAML)
```yaml
PumpType:
  type: ObjectType
  base: AssetType
  description: "Centrifugal pump"
  components:
    FlowRate:
      type: AnalogItemType
      dataType: Double
      engineeringUnits: m³/h
      euRange: {low: 0, high: 5000}
    RPM:
      type: AnalogItemType
      euRange: {low: 0, high: 1800}
    PowerConsumption:
      engineeringUnits: kW
  methods:
    - StartPump
    - StopPump
    - SetSpeed
```

**2. Asset Instance** (assets - JSON)
```json
{
  "id": "IPS_PMP_001",
  "name": "Influent Pump 1",
  "type": "InfluentPumpType",
  "parent": "S00630",
  "simulate": true,
  "properties": {
    "Manufacturer": "Flygt",
    "Model": "CP3300.900"
  },
  "designSpecs": {
    "DesignFlow": 2500.0,
    "MaxRPM": 1180
  }
}
```

**3. Live OPC UA Node**
```
NodeId: ns=1;s=IPS_PMP_001
IPS_PMP_001 : InfluentPumpType
├─ FlowRate: [live] m³/h
├─ RPM: [live]
├─ Power: [live] kW
└─ Status: RUNNING/STOPPED
```

#### Asset Hierarchy Diagram
- Navigable link to `/assets` page
- Shows: Plant → Process → System → Assets
- Asset Summary with statistics

---

## Slide 9: Communication Models Core Concepts

**ID:** `slide-9`
**Section:** SECTION 03 • 5–12 MINUTES
**Title:** Core Concepts
**Badge:** LIVE COMPARISON (animated)
**Goal:** Build foundational mental model

### Content

#### Two-Column Layout with Animated SVG Diagrams

**Client-Server Model Card**
- Badge: INTERACTIVE
- Animated SVG Diagram:
  - CLIENT box (SCADA) ↔ SERVER box (OPC UA)
  - Animated READ request packet (cyan) moving Client → Server
  - Animated DATA response packet (green) moving Server → Client
  - SESSION state indicator with pulsing status light
- Label: "Bidirectional • Stateful • 1:1 Connection"

Key Characteristics (2x2 grid):
| Icon | Feature |
|------|---------|
| 🔄 | Interactive control |
| 🔐 | Stateful sessions |
| ↔️ | Bidirectional |
| 🖥️ | SCADA, HMI |

**Publish-Subscribe Model Card**
- Badge: SCALABLE
- Animated SVG Diagram:
  - PUBLISHER box → BROKER (optional, dashed) → Multiple SUBSCRIBER boxes
  - Animated broadcast waves emanating from publisher
  - Topic label showing data flow path
- Label: "Unidirectional • Stateless • 1:N Distribution"

Key Characteristics (2x2 grid):
| Icon | Feature |
|------|---------|
| 📡 | One-to-many distribution |
| 🚀 | Stateless & scalable |
| 📊 | Topic-based routing |
| ☁️ | Cloud-native |

---

## Slide 10: Cross-Platform Interoperability

**ID:** `slide-10`
**Section:** SECTION 03 - COMMUNICATION ARCHITECTURE
**Badge:** DUAL MODEL

### Content

#### Three-Column Architecture

**Left: Client-Server Model**
- Protocols: TCP/IP :4840, WebSocket
- Clients: Desktop, Web, Mobile
- Connection animation

**Center: OPC UA Server**
- Simulation Engine
- Endpoint: opc.tcp://localhost:4840
- Dual arrows (C/S and PubSub)

**Right: Pub/Sub Model**
- Protocol: MQTT Broker
- Topic: plant/pumps/Pump_01/telemetry
- Subscribers: Dashboard, Historian, Analytics

#### Bottom Summary
| Protocol | Use Case |
|----------|----------|
| TCP/IP | Desktop OPC UA Clients |
| WebSocket | Browser-based Clients |
| MQTT Broker | Scalable Distribution |
| Topics | Semantic Namespaces |

---

## Slide 11: Client-Server vs Pub/Sub Comparison

**ID:** `slide-11`
**Section:** SECTION 03 • COMMUNICATION MODELS
**Title:** Client-Server vs Pub/Sub
**Interactive:** Click-to-zoom on all elements (6 zoomable sections)
**Goal:** Deep dive comparison of both communication paradigms

### Content

#### Main Comparison Diagram (Zoomable - 900x200 SVG)
- Left side: CLIENT-SERVER (cyan gradient background)
  - CLIENT box ↔ SERVER box with animated request/response packets
  - Label: "BIDIRECTIONAL • STATEFUL • 1:1"
- Right side: PUB/SUB (orange gradient background)
  - PUBLISHER → BROKER (optional/dashed) → Multiple SUBSCRIBERs
  - Label: "UNIDIRECTIONAL • STATELESS • 1:N"
- Center: "VS" divider line

#### Six Click-to-Zoom Overlay Sections

**1. Architecture Diagram** (`focusedBox === 'diagram'`)
- Full-width expanded view of the comparison diagram
- Detailed labels for each component
- Shows: Read • Write • Subscribe • Browse • Call Methods (Client-Server)
- Shows: Telemetry • Analytics • Cloud • Historians (Pub/Sub)

**2. Communication Patterns** (`focusedBox === 'communication'`)
| Aspect | Client-Server | Pub/Sub |
|--------|---------------|---------|
| Direction | Request → Response | Publish → Broadcast |
| Transport | TCP connection maintained | UDP multicast or broker-based |
| State | Session-based, preserves context | No connection state |
| Updates | Supports subscriptions | Fire-and-forget semantics |

**3. Message Encoding** (`focusedBox === 'encoding'`)
| Client-Server | Pub/Sub |
|---------------|---------|
| UA Binary | UADP Binary |
| XML | JSON |
| JSON | - |
| Service-oriented with full headers | Compact NetworkMessages |

**4. Purpose & Use Cases** (`focusedBox === 'purpose'`)
| Client-Server | Pub/Sub |
|---------------|---------|
| Interactive Control & Monitoring | Massive Scale Telemetry |
| Write values to actuators | Cloud data ingestion (Azure IoT, AWS) |
| Call methods on devices | Analytics & ML pipelines |
| Browse and discover address space | Edge-to-cloud streaming |

**5. Client-Server Message Example** (`focusedBox === 'cs-message'`)
```json
// ReadRequest Message
{
  "RequestHeader": {
    "AuthenticationToken": "session-42",
    "Timestamp": "2025-01-15T10:30:00Z",
    "RequestHandle": 12345
  },
  "NodesToRead": [{
    "NodeId": "ns=1;s=Pump_01.FlowRate",
    "AttributeId": 13  // Value
  }]
}
```

**6. Pub/Sub Message Example** (`focusedBox === 'ps-message'`)
```json
// UADP NetworkMessage (compact)
{
  "PublisherId": "Pump_Station_01",
  "DataSetWriterId": 1,
  "SequenceNumber": 12847,
  "Payload": {
    "FlowRate": 2340.5,
    "RPM": 1145,
    "Power": 124.8
  }
}
```

#### Interaction
- Click any card/diagram to open full-screen zoom overlay
- Press ESC or click outside to close
- "Click to zoom" hint displayed on hover

---

## Slide 12: Services & Data Access

**ID:** `slide-12`
**Section:** SECTION 04 - 22-30 MINUTES
**Goal:** Show how data flows correctly

### Content

#### Core Services
| Service | Color | Description |
|---------|-------|-------------|
| Browse | Purple | Discover nodes |
| Read/Write | Cyan | Discrete access |
| Subscribe | Green | Change notifications |
| Call | Orange | Execute logic |
| HistoryRead | Pink | Aggregates |

#### Three Operating Rules
1. **Subscriptions are DEFAULT** (green)
2. **Reads are EXCEPTIONS** (orange)
3. **Quality is ALWAYS explicit** (cyan)

Note: OPC UA always provides: Value + StatusCode + Timestamp

#### IEC 62541-13 Time-Weighted Average Formula
```
x̄ = Σ(xᵢ · Δtᵢ) / Σ(Δtᵢ)
```
Where:
- xᵢ = raw data value
- Δtᵢ = time interval

Visual timeline showing step function with shaded areas for time intervals.

---

## Slide 13: Purdue Model - Network Architecture

**ID:** `slide-13`
**Section:** SECTION 05 - Network Architecture
**Badge:** Live Network Active

### Content

#### Purdue Model Layers (Interactive SVG)

| Level | Name | Description | Color |
|-------|------|-------------|-------|
| 5 | ENTERPRISE | ERP, Business Planning, Cloud | Purple |
| 4 | SITE BUSINESS | MES, Scheduling, KPI | Pink |
| 3 | SITE OPERATIONS | SCADA, HMI, Batch | Orange |
| 2 | AREA CONTROL | PLCs, DCS, RTUs | Green |
| 1 | BASIC CONTROL | Sensors, Actuators, I/O | Cyan |
| 0 | PHYSICAL PROCESS | Wastewater Simulation | Gray |

- OPC UA backbone spine on right side
- Click layers to highlight and show context
- Animated data packet flowing through levels
- "Simulate Data Flow" button

---

## Slide 14: Network & Transport Protocols

**ID:** `slide-14`
**Section:** SECTION 05 - NETWORK PROTOCOLS
**Badge:** PROTOCOL SIMULATION

### Content

#### Three Protocol Cards

**1. UA TCP Binary**
- Protocol: TCP :4840
- Encoding: Binary
- Description: High-performance, stateful sessions, SecureChannel encryption

**2. UA WebSocket**
- Protocol: WSS :443
- Encoding: JSON/Binary
- Description: Browser-compatible, TLS encryption, firewall-friendly

**3. UADP Multicast**
- Protocol: UDP :4840
- Encoding: UADP
- Description: Broker-less PubSub, deterministic latency, TSN-compatible

#### UA TCP Connection Sequence Diagram
Reference: OPC 10000-6

| Step | Message | Direction |
|------|---------|-----------|
| 1 | HEL (Hello) | Client → Server |
| 2 | ACK (Acknowledge) | Server → Client |
| 3 | OPN (OpenSecureChannel) | Client → Server |
| 4 | MSG (CreateSession, ActivateSession, Browse/Read/Subscribe) | Bidirectional |
| 5 | CLO (Close) | Client → Server |

---

## Slide 15: Security Architecture

**ID:** `slide-15`
**Section:** SECTION 05 - SECURITY
**Badge:** IEC 62443 COMPLIANT

### Content

#### Security Policies Evolution

| Policy | Status | Details |
|--------|--------|---------|
| Basic256 | Deprecated | SHA-1 broken, 1024-bit weak |
| Aes128_Sha256 | Current | SHA-256 ✓, 2048-bit RSA ✓ |
| Aes256_Sha256 + ECC | Recommended | RsaPss padding, ECC_nistP384, Quantum-ready |

#### Why X.509 Certificates?

**Password Auth (Weak):**
- ✗ Shared secret on network
- ✗ Replay attacks possible
- ✗ No non-repudiation
- ✗ Credential theft risk

**X.509 Certificate (Strong):**
- ✓ No secret on network
- ✓ Challenge-response
- ✓ Digital signatures
- ✓ PKI trust chain

**Key Principle:** Private key NEVER leaves device → Zero credential theft

#### Security Modes
| Mode | Description |
|------|-------------|
| None | Testing only |
| Sign | Message signing |
| SignAndEncrypt | Full protection |

---

## Slide 16: SecureChannel vs Session

**ID:** `slide-16`
**Section:** SECTION 05 - SECURITY LAYERS
**Badge:** DUAL PROTECTION
**Goal:** Understand why OPC UA needs BOTH layers

### Content

#### Layered Security Diagram

```
┌──────────────────────────────────────────────────────────┐
│  SECURE CHANNEL (Purple)                                 │
│  ┌─────────────────────────────────────────────────────┐ │
│  │  SESSION (Orange)                                   │ │
│  │                                                     │ │
│  │   [ReadRequest] ────────────> [DataValue]          │ │
│  │                                                     │ │
│  │  SessionId: 42          AuthToken ✓                │ │
│  └─────────────────────────────────────────────────────┘ │
│  🔐 AES-256                              RSA-2048 🔐    │
└──────────────────────────────────────────────────────────┘
```

#### Comparison

| Layer | Purpose | Protects |
|-------|---------|----------|
| **SecureChannel** | TRANSPORT | The PIPE - ensures no one can read or tamper with messages |
| **Session** | APPLICATION | WHO - user identity, roles, and message semantics |

**Key Difference:**
- SecureChannel: No one outside can read/forge
- Session: Ensures only authorized users perform actions
- **Both required for defense in depth**

---

## Slide 17: Role-Based Access Control

**ID:** `slide-17`
**Section:** SECTION 05 - AUTHORIZATION

### Content

#### Permission Matrix

| Role | Pump Control | Tank Settings | Configuration | Alarms |
|------|--------------|---------------|---------------|--------|
| **Operator** | ✓ Start/Stop | ✓ Set Level | ✗ None | ○ Read |
| **Maintenance** | ✓ Reset | ✓ Calibrate | ○ Read | ✓ Clear |
| **Engineer** | ✓ Full | ✓ Full | ✓ Modify | ✓ Full |

#### Authentication Options
- Anonymous (read-only, testing)
- Username / Password
- Certificate-based users
- X.509 User Certificates

#### Auditing (v1.05.06)
- Connection attempts (success/fail)
- Configuration changes
- User authentication events
- NIST 800-82 / IEC 62443

---

## Slide 18: Future Directions

**ID:** `slide-18`
**Section:** SECTION 06 - FUTURE
**Badge:** OPC 10000 Series

### Content

#### OPC Foundation Companion Specifications

| Spec | Industry | Description |
|------|----------|-------------|
| DI | Devices | Device Information |
| PLCopen | Automation | PLC programming |
| ISA-95 | Manufacturing | MES integration |
| MDIS | Oil & Gas | Subsea systems |
| PackML | Packaging | Machine states |

#### Emerging Technologies

| Technology | Application |
|------------|-------------|
| TSN | Time-Sensitive Networking |
| 5G | Industrial wireless |
| OPC UA FX | Field exchange |
| Cloud | Azure, AWS integration |

---

## Slide 19: Deep Dive - Communication Model

**ID:** `slide-19`
**Section:** DEEP DIVE - COMMUNICATION MODEL
**Badge:** INTERACTIVE
**Goal:** Understanding the complete request/response lifecycle

### Content

#### Message Sequence Diagram (900x320 SVG)

**Actors:**
- OPC UA Client (SCADA/HMI) - Left
- OPC UA Server (Pump Controller) - Right

**Message Flow:**

| Step | Message | Direction | Details |
|------|---------|-----------|---------|
| 1 | CreateSessionRequest | Client → Server | Initiate session |
| 2 | CreateSessionResponse | Server → Client | SessionId, Nonce |
| 3 | ActivateSessionRequest | Client → Server | Credentials, Signature |
| 4 | ActivateSessionResponse | Server → Client | Session activated ✓ |
| 5 | ReadRequest | Client → Server | ns=1;s=Pump_01.FlowRate |
| 6 | ReadResponse | Server → Client | Value: 2340.5, Status: Good, Timestamp |

**Secure Channel Box:** Steps 5-6 occur inside encrypted session

#### Key Insights
| Steps | Phase | Description |
|-------|-------|-------------|
| 1-2 | Session Creation | Server allocates resources, generates nonces |
| 3-4 | Authentication | Client proves identity via signature |
| 5-6 | Data Exchange | All messages encrypted with session keys |
| Always | Quality Metadata | Every response includes StatusCode + Timestamp |

---

## Slide 20: Live Demo

**ID:** `slide-20`
**Section:** SECTION 08 - LIVE DEMO
**Badge:** CONNECTED/CONNECTING status
**Goal:** Real-time OPC UA server interaction

### Content

#### Left Column: Control Panel

**Pump Control** (NodeId: ns=1;s=IPS_PMP_001)
- Status indicator with pulsing dot
- Live values grid:
  | Metric | Color |
  |--------|-------|
  | Flow Rate (GPM) | Cyan |
  | RPM | Orange |
  | Power (kW) | Green |
  | Power Factor | Purple |

- Control buttons: Start Pump / Stop Pump

#### Right Column: Communication Log

Terminal-style display:
```
$ opcua-client connect opc.tcp://localhost:4840
[INFO] Establishing SecureChannel with SecurityPolicy: Aes256_Sha256_RsaPss
[SUCCESS] SecureChannel established, TokenId: 1
[INFO] Creating session...
[SUCCESS] Session activated, SessionId: ns=1;i=42

$ read ns=1;s=IPS_PMP_001.FlowRate
[READ] NodeId: ns=1;s=IPS_PMP_001.FlowRate
[RESPONSE] Value: [live] | Status: Good | Time: [now]

$ subscribe ns=1;s=IPS_PMP_001.* --interval=1000ms
[SUBSCRIBED] MonitoredItem created for 27 variables
[NOTIFICATION] RPM: [value] | Power: [value] kW
```

#### Architecture Diagram
```
This Dashboard ──HTTP/WS──> API Endpoint ──opc.tcp──> OPC UA Server
(React + WebSocket)        (Node.js API)            (Python asyncua)
```

---

## Slide 21: Key Takeaways

**ID:** `slide-21`
**Section:** SUMMARY - KEY TAKEAWAYS

### Content

#### Six Key Takeaways (3x2 Grid)

| # | Title | Key Points |
|---|-------|------------|
| 1 | **Address Space is a Graph** | Not flat registers; Nodes + References = Semantic context; Self-describing |
| 2 | **Security is Layered** | SecureChannel encrypts pipe; Session authenticates user; Both required |
| 3 | **Two Communication Models** | Client-Server: interactive; PubSub: scalable; Choose based on use case |
| 4 | **Type System is Powerful** | Define once, instantiate many; ObjectTypes carry schemas; Companion specs |
| 5 | **Quality is First-Class** | Every value has StatusCode + Timestamp; Bad quality propagates; No silent failures |
| 6 | **Platform Agnostic** | Works across OS, languages, networks; Embedded to cloud; Vendor-neutral |

#### Quick Reference: When to Use What

| Scenario | Solution | Protocol |
|----------|----------|----------|
| Control a pump | Client-Server + Write | TCP :4840 |
| Dashboard monitoring | Client-Server + Subscribe | WebSocket |
| Cloud analytics | PubSub + MQTT | MQTT :8883 |
| Historical trends | HistoryRead + Aggregates | TCP :4840 |

---

## Slide 22: Conclusion

**ID:** `slide-22`
**Section:** Conclusion
**Class:** `title-slide`

### Content

#### Main Quote
> **"OPC UA is not about moving data.**
> It is about preserving **meaning**, **trust**, and **quality**
> across decades of industrial systems."

#### Five Value Pillars

| Pillar | Description | Icon |
|--------|-------------|------|
| Semantic Clarity | First-class objects | Database |
| Security by Design | Built-in protection | ShieldCheck |
| Interoperability | Vendor-neutral | RefreshCw |
| Scalability | Plant to enterprise | Layers |
| Future-Ready | TSN, 5G, Cloud | LayoutGrid |

#### Call to Action
- Button: "Launch Live Dashboard →" (links to /)

#### Footer
Based on OPC UA Specification v1.05.06 (October 2025)

---

## Interactive Features Summary

### Navigation
- **Keyboard:** Arrow keys (←/→), Page Up/Down
- **Mouse:** Click navigation buttons, slide selector dropdown
- **Touch:** Swipe gestures

### Theme Toggle
- Dark Mode (default)
- Business/Light Mode

### Live Features
- Real-time OPC UA server connection status
- Live pump simulation data
- Dynamic values throughout presentation

### Interactive Elements
- Click-to-zoom on Slide 11 (all boxes)
- Clickable agenda items to navigate
- Hover effects on all cards
- Animated SVG diagrams
- Interactive Purdue model layer selection
- Live demo pump controls

### Links
- `/types` - Type definitions page
- `/assets` - Asset hierarchy page
- `/` - Main dashboard

---

## File References

| File | Purpose |
|------|---------|
| `page.tsx` | Main presentation component |
| `types.yaml` | OPC UA type definitions |
| `assets.json` | Equipment instance configuration |
| `presentation.md` | Slide structure reference |

---

*This documentation reflects the OPC UA Architecture Presentation as of the current implementation.*
