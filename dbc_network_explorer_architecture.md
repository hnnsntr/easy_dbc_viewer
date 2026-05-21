# DBC Network Explorer — Architecture & Decoding Strategy

## 1. Project Goal

**DBC Network Explorer** is a browser-based engineering tool that turns a `.dbc` CAN database file into an interactive network map of ECUs, messages, and signals.

The goal is to make unknown CAN networks easier to understand. Instead of reading a DBC file line by line, the user should be able to upload a file and immediately see:

- Which ECUs/nodes exist in the network
- Which ECU transmits which messages
- Which ECUs receive which signals
- Which ECUs logically communicate with each other
- Which messages and signals connect two nodes
- Where a specific CAN ID, message, signal, or ECU appears

This is not intended to describe the physical wiring topology of the vehicle. A DBC file usually describes the **logical communication model**, not the real bus wiring, gateway routing, or physical neighbor relationships.

A precise description would be:

> A browser-based DBC visualization tool that reconstructs the logical ECU communication graph from CAN message transmitters and signal receivers.

---

## 2. Why This Project Is Useful

DBC files are common in automotive development, but they are usually difficult to inspect quickly. Most tools focus on signal decoding or raw CAN trace analysis, while the network-level relationships between ECUs are often hidden in the file structure.

This project solves a practical engineering problem:

- Fast onboarding into an unknown vehicle network
- Quick understanding of who sends and receives which signals
- Easier review of DBC files during debugging, integration, or reverse engineering
- Better visualization for communication between software, system, and test engineers

For a GitHub portfolio, this project demonstrates:

- Automotive domain knowledge
- Real engineering tooling
- Data parsing and transformation
- Interactive frontend development
- Clean backend API design
- Graph visualization
- Production-oriented code structure

---

## 3. Recommended Product Form

A **browser application** is the best format.

Reasons:

- DBC files are easy to upload via drag-and-drop
- Interactive graph visualization works best in a browser
- No installation friction for demos
- Easy deployment via Docker or static frontend + backend
- Good visual impact for GitHub screenshots and recruiter demos

Recommended final experience:

1. User opens web app
2. User drags in a `.dbc` file
3. Backend parses the file
4. Frontend shows an interactive ECU communication graph
5. User clicks nodes/edges/messages/signals to inspect details
6. User can search, filter, export, and compare views

---

## 4. Core DBC Concepts

A DBC file can contain several relevant object types.

### 4.1 Nodes / ECUs

DBC node definitions are usually stored in the `BU_` section.

Example:

```dbc
BU_: Gateway ABS EPS EngineECU Cluster ADAS
```

These nodes usually represent ECUs, software components, network participants, or logical bus nodes.

### 4.2 Messages

Messages are defined with `BO_` entries.

Example:

```dbc
BO_ 256 VehicleSpeed: 8 ABS
```

Meaning:

- CAN ID: `256`
- Message name: `VehicleSpeed`
- DLC: `8` bytes
- Transmitter: `ABS`

A message usually has exactly one transmitter in the main `BO_` definition.

### 4.3 Signals

Signals are defined with `SG_` entries below a message.

Example:

```dbc
SG_ WheelSpeed_FL : 0|16@1+ (0.01,0) [0|300] "km/h" EngineECU,ADAS,Cluster
```

Meaning:

- Signal name: `WheelSpeed_FL`
- Start bit: `0`
- Length: `16`
- Byte order: Intel/Motorola
- Signedness
- Scale and offset
- Min/max
- Unit
- Receivers: `EngineECU`, `ADAS`, `Cluster`

### 4.4 Logical Communication Relationship

The logical relationship is derived from message transmitter and signal receivers.

Example:

```text
ABS transmits message VehicleSpeed
VehicleSpeed contains signal WheelSpeed_FL
WheelSpeed_FL is received by ADAS and Cluster
```

This creates logical graph edges:

```text
ABS -> ADAS
ABS -> Cluster
```

The edge should store the messages and signals that caused the relationship.

---

## 5. Important Limitation

DBC files do **not always** contain enough information to determine:

- Physical wiring topology
- Which ECU is physically next to another ECU
- Which bus segment a node belongs to
- Gateway routing behavior
- Runtime activity
- Whether a receiver actually uses a signal in software

Therefore, the graph should be labeled clearly as:

> Logical communication graph derived from DBC transmitters and receivers.

Not:

> Physical vehicle network topology.

This distinction makes the tool technically correct and avoids overclaiming.

---

## 6. High-Level Architecture

Recommended stack:

```text
Frontend:
  React + TypeScript
  React Flow or Cytoscape.js
  Tailwind CSS
  Zustand or Redux Toolkit for state

Backend:
  Python
  FastAPI
  cantools for DBC parsing
  Pydantic for API schemas

Storage:
  MVP: in-memory per upload
  Later: SQLite/PostgreSQL for saved projects

Deployment:
  Docker Compose
  Frontend container
  Backend container
```

Suggested repository structure:

```text
dbc-network-explorer/
├── README.md
├── docker-compose.yml
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── api/
│   │   │   ├── routes_upload.py
│   │   │   ├── routes_graph.py
│   │   │   └── routes_decode.py
│   │   ├── dbc/
│   │   │   ├── parser.py
│   │   │   ├── graph_builder.py
│   │   │   ├── models.py
│   │   │   └── validators.py
│   │   ├── services/
│   │   │   ├── project_store.py
│   │   │   └── export_service.py
│   │   └── tests/
│   ├── pyproject.toml
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   │   ├── UploadDropzone.tsx
│   │   │   ├── NetworkGraph.tsx
│   │   │   ├── NodeInspector.tsx
│   │   │   ├── EdgeInspector.tsx
│   │   │   ├── MessageTable.tsx
│   │   │   ├── SignalTable.tsx
│   │   │   └── SearchCommand.tsx
│   │   ├── lib/
│   │   │   ├── api.ts
│   │   │   ├── graphTransforms.ts
│   │   │   └── types.ts
│   │   └── styles/
│   ├── package.json
│   └── Dockerfile
├── demo/
│   ├── demo_vehicle.dbc
│   └── screenshots/
└── docs/
    ├── architecture.md
    ├── dbc-decoding.md
    └── graph-model.md
```

---

## 7. Data Flow

```text
User uploads DBC
        ↓
Frontend sends file to backend
        ↓
Backend parses DBC using cantools
        ↓
Backend extracts nodes, messages, signals, receivers
        ↓
Backend builds normalized internal graph model
        ↓
Frontend receives graph JSON
        ↓
Frontend renders interactive ECU communication map
        ↓
User searches, filters, clicks, exports
```

---

## 8. Backend Parsing Strategy

### 8.1 Parser Library

Use `cantools` as the primary parser.

Reasons:

- Mature Python DBC parser
- Supports common DBC constructs
- Can decode CAN frames later
- Widely used in open-source CAN tooling

Example backend parsing concept:

```python
import cantools

def parse_dbc(file_path: str):
    db = cantools.database.load_file(file_path)
    return db
```

### 8.2 Extract Nodes

Possible sources:

- Explicit DBC node list from `BU_`
- Message sender names
- Signal receiver names

The tool should merge all discovered names into one normalized node list.

Reason: Some DBC files may have incomplete `BU_` sections but still contain senders/receivers in messages/signals.

Node extraction strategy:

```text
nodes = set()

1. Add all explicitly defined nodes from DBC
2. Add every message.sender
3. Add every signal.receiver
4. Remove placeholder receivers such as Vector__XXX if desired
5. Mark nodes by source:
   - explicit_node
   - inferred_sender
   - inferred_receiver
```

Recommended node object:

```json
{
  "id": "ABS",
  "name": "ABS",
  "kind": "ecu",
  "source": ["explicit_node", "message_sender"],
  "txMessageCount": 12,
  "rxMessageCount": 8,
  "txSignalCount": 42,
  "rxSignalCount": 71
}
```

### 8.3 Extract Messages

For every DBC message, extract:

- CAN ID
- Frame ID format: standard / extended
- Message name
- DLC
- Sender
- Cycle time if available
- Comment if available
- Signals

Recommended message object:

```json
{
  "id": "256",
  "canId": 256,
  "hexId": "0x100",
  "name": "VehicleSpeed",
  "dlc": 8,
  "sender": "ABS",
  "cycleTimeMs": 10,
  "comment": "Vehicle speed and wheel speed information",
  "signalIds": ["VehicleSpeed.WheelSpeed_FL", "VehicleSpeed.WheelSpeed_FR"]
}
```

### 8.4 Extract Signals

For every signal, extract:

- Signal name
- Parent message
- Start bit
- Bit length
- Byte order
- Signed/unsigned
- Scale
- Offset
- Min/max
- Unit
- Receivers
- Choices / enumerations
- Multiplexing information if present
- Comment if available

Recommended signal object:

```json
{
  "id": "VehicleSpeed.WheelSpeed_FL",
  "name": "WheelSpeed_FL",
  "messageId": "256",
  "messageName": "VehicleSpeed",
  "sender": "ABS",
  "receivers": ["EngineECU", "ADAS", "Cluster"],
  "startBit": 0,
  "length": 16,
  "byteOrder": "little_endian",
  "isSigned": false,
  "scale": 0.01,
  "offset": 0,
  "minimum": 0,
  "maximum": 300,
  "unit": "km/h",
  "choices": null,
  "comment": null
}
```

---

## 9. Graph Building Strategy

### 9.1 Node Graph

Each ECU/node becomes one graph node.

```text
ABS
EPS
ADAS
Gateway
Cluster
EngineECU
```

### 9.2 Edge Creation

For each message:

1. Identify message sender
2. Iterate over all signals in the message
3. For every receiver of every signal:
   - Skip if receiver equals sender, unless self-loop view is enabled
   - Create or update edge from sender to receiver
   - Attach message and signal metadata to the edge

Pseudo logic:

```python
edges = {}

for message in messages:
    sender = message.sender

    for signal in message.signals:
        for receiver in signal.receivers:
            if receiver == sender:
                continue

            edge_key = (sender, receiver)

            if edge_key not in edges:
                edges[edge_key] = create_edge(sender, receiver)

            edges[edge_key].messages.add(message.id)
            edges[edge_key].signals.add(signal.id)
```

Recommended edge object:

```json
{
  "id": "ABS__ADAS",
  "source": "ABS",
  "target": "ADAS",
  "messageCount": 4,
  "signalCount": 18,
  "messages": ["256", "260", "310", "311"],
  "signals": ["VehicleSpeed.WheelSpeed_FL", "YawRate.YawRate", "BrakeStatus.BrakePressure"]
}
```

### 9.3 Message-Level Graph

Optional second graph mode:

```text
ECU -> Message -> Signal -> ECU
```

This is more detailed but can become visually crowded.

Recommended graph modes:

1. **ECU Communication View** — default
2. **Message Flow View** — shows ECUs and messages as separate nodes
3. **Signal Detail View** — available only after selecting an edge/message

---

## 10. Visualization Design

### 10.1 Overall Layout

Recommended browser layout:

```text
┌──────────────────────────────────────────────────────────────┐
│ Top Bar: Project name | Upload | Search | Export | Settings  │
├───────────────┬────────────────────────────────────┬─────────┤
│ Left Sidebar  │                                    │ Right   │
│ Filters       │        Interactive Graph            │ Details │
│               │                                    │ Panel   │
├───────────────┴────────────────────────────────────┴─────────┤
│ Bottom Panel: Message table / Signal table / Warnings         │
└──────────────────────────────────────────────────────────────┘
```

### 10.2 Visual Style

Design direction:

- Dark technical UI by default
- High contrast but not toy-like
- Clean cards and panels
- Automotive/engineering feel
- Smooth graph interactions
- Minimal but polished animation

Suggested visual language:

- Background: dark graphite
- Nodes: rounded rectangles or circles
- Gateway ECUs: slightly larger / different border
- Edges: curved directional arrows
- Edge thickness: number of exchanged signals or messages
- Edge labels: message count or dominant message
- Selected node: highlighted border
- Selected communication path: emphasized edge
- Inactive nodes: faded

The UI should feel closer to a professional engineering tool than a flashy dashboard.

### 10.3 Node Appearance

Node card content:

```text
ABS
TX: 12 messages
RX: 8 messages
Signals: 42 TX / 71 RX
```

Node sizing options:

- Size by total message count
- Size by total signal count
- Fixed size for readability

Node coloring options:

- By ECU type if inferred from name
- By bus if known
- By TX/RX ratio
- By selected search result

Possible ECU type inference:

```text
ABS, ESP, ESC        -> Chassis
EPS, Steering        -> Steering
Engine, ECM, PCM     -> Powertrain
ADAS, Radar, Camera  -> ADAS
BCM, Gateway         -> Body / Gateway
Cluster, HMI         -> Display / Infotainment
```

This should be optional and clearly labeled as heuristic.

### 10.4 Edge Appearance

Edge content:

```text
ABS → ADAS
4 messages
18 signals
```

Edge thickness:

```text
1 signal      -> thin
2-10 signals  -> medium
10+ signals   -> thick
```

Edge interactions:

- Hover: show quick tooltip
- Click: open right-side edge inspector
- Double-click: isolate communication between those two nodes

Edge tooltip example:

```text
ABS → ADAS
Messages: 4
Signals: 18
Top messages:
- VehicleSpeed 0x100
- BrakeStatus 0x120
- YawRate 0x140
```

---

## 11. Main Views

### 11.1 Upload View

Before upload, show a polished landing/upload screen:

```text
Drop your DBC file here
or click to browse

Supported: .dbc
Demo: Load demo vehicle network
```

Additional useful options:

- Load demo DBC
- Recent projects, later version
- Privacy note: file is processed locally or only inside backend container

### 11.2 Graph View

Main view after upload:

- Interactive ECU graph
- Zoom/pan
- Minimap
- Search
- Filters
- Layout options

Layout algorithms:

- Force-directed layout
- Hierarchical left-to-right layout
- Circular layout
- Grouped by inferred ECU domain

Recommended default:

> Force-directed layout for exploration, with optional hierarchical layout for cleaner screenshots.

### 11.3 Node Inspector

When clicking an ECU node, right panel shows:

```text
ECU: ABS

Overview:
- Transmitted messages: 12
- Received messages: 8
- Transmitted signals: 42
- Received signals: 71
- Communication partners: 5

Tabs:
1. TX Messages
2. RX Messages
3. TX Signals
4. RX Signals
5. Communication Partners
```

TX message table:

```text
CAN ID   Name            DLC   Cycle   Signals   Receivers
0x100    VehicleSpeed    8     10 ms   4         ADAS, Cluster
0x120    BrakeStatus     8     20 ms   6         Gateway, EngineECU
```

### 11.4 Edge Inspector

When clicking an edge:

```text
Communication: ABS → ADAS

Summary:
- 4 messages
- 18 signals
- Average cycle time: 20 ms

Messages:
0x100 VehicleSpeed
0x120 BrakeStatus
0x140 YawRate

Signals:
WheelSpeed_FL
WheelSpeed_FR
BrakePressure
YawRate
```

Useful features:

- Export edge communication as CSV
- Show only this path
- Show reverse communication if it exists

### 11.5 Message Inspector

When clicking a message:

```text
Message: VehicleSpeed
CAN ID: 0x100 / 256
DLC: 8
Sender: ABS
Cycle time: 10 ms
Signals: 4
Receivers: ADAS, Cluster, EngineECU
```

Signal layout table:

```text
Signal          Bits      Type     Factor   Offset   Unit   Receivers
WheelSpeed_FL   0|16      uint16   0.01     0        km/h   ADAS, Cluster
WheelSpeed_FR   16|16     uint16   0.01     0        km/h   ADAS, Cluster
```

Optional visual bit layout:

```text
Byte 0  Byte 1  Byte 2  Byte 3  Byte 4  Byte 5  Byte 6  Byte 7
[ WheelSpeed_FL ][ WheelSpeed_FR ][ ...                         ]
```

This would be a very strong visual detail for automotive engineers.

### 11.6 Search Command

Global search should support:

- ECU name
- Message name
- Signal name
- CAN ID decimal
- CAN ID hex
- Unit
- Receiver
- Sender

Example searches:

```text
0x100
VehicleSpeed
WheelSpeed_FL
ABS
km/h
```

Search behavior:

- Highlight matching nodes/edges
- Open matching object on Enter
- Support fuzzy matching

---

## 12. Filtering Strategy

Useful filters:

- Show only selected ECU domain
- Show only messages above/below a cycle time
- Show only extended IDs
- Show only messages with comments
- Show only messages with missing receivers
- Hide self-loops
- Hide low-traffic edges
- Filter by unit, for example `km/h`, `Nm`, `%`, `deg`
- Filter by sender
- Filter by receiver

Graph simplification options:

```text
[ ] Hide isolated nodes
[ ] Hide Vector__XXX receivers
[ ] Merge gateway-heavy traffic
[ ] Show only selected node neighborhood
[ ] Show reverse edges separately
```

---

## 13. Decoding Strategy for Future Version

The first version only needs DBC structure visualization.

A later version can add actual CAN frame decoding.

### 13.1 Supported Trace Inputs

Potential formats:

- `.asc`
- `.blf`
- `.csv`
- `.log`
- `.mf4`, later if needed

### 13.2 Decode Flow

```text
User uploads DBC
        ↓
User uploads CAN trace
        ↓
Backend loads DBC
        ↓
Backend reads CAN frames
        ↓
For every frame:
  - Match arbitration ID to message
  - Decode signals using cantools
  - Store timestamp, raw bytes, decoded values
        ↓
Frontend overlays runtime activity on graph
```

### 13.3 Runtime Overlay Ideas

Once a trace is decoded, the graph becomes more powerful:

- Highlight active messages
- Fade unused messages
- Show message frequency measured from trace
- Show signal value timelines
- Show top talkers
- Show burst traffic
- Show missing expected messages
- Animate communication during playback

Example:

```text
ABS → ADAS
DBC messages: 4
Active in trace: 3
Measured frequency: 98.7 Hz
```

This creates a strong version 2 roadmap.

---

## 14. API Design

### 14.1 Upload DBC

```http
POST /api/projects
Content-Type: multipart/form-data
```

Response:

```json
{
  "projectId": "abc123",
  "fileName": "demo_vehicle.dbc",
  "nodeCount": 12,
  "messageCount": 86,
  "signalCount": 714,
  "warnings": []
}
```

### 14.2 Get Graph

```http
GET /api/projects/{projectId}/graph
```

Response:

```json
{
  "nodes": [],
  "edges": [],
  "messages": [],
  "signals": [],
  "metadata": {
    "nodeCount": 12,
    "messageCount": 86,
    "signalCount": 714
  }
}
```

### 14.3 Get Node Details

```http
GET /api/projects/{projectId}/nodes/{nodeId}
```

### 14.4 Get Message Details

```http
GET /api/projects/{projectId}/messages/{messageId}
```

### 14.5 Search

```http
GET /api/projects/{projectId}/search?q=VehicleSpeed
```

### 14.6 Export

```http
GET /api/projects/{projectId}/export/graph.json
GET /api/projects/{projectId}/export/messages.csv
GET /api/projects/{projectId}/export/signals.csv
```

---

## 15. Internal Data Model

Recommended normalized model:

```text
Project
├── Nodes
├── Messages
├── Signals
├── Edges
└── Warnings
```

### 15.1 Project

```json
{
  "id": "abc123",
  "fileName": "demo_vehicle.dbc",
  "createdAt": "2026-05-20T12:00:00Z",
  "metadata": {
    "nodeCount": 12,
    "messageCount": 86,
    "signalCount": 714,
    "edgeCount": 34
  }
}
```

### 15.2 Node

```json
{
  "id": "ABS",
  "name": "ABS",
  "domain": "Chassis",
  "source": ["explicit_node", "message_sender"],
  "txMessages": ["256", "260"],
  "rxMessages": ["512", "520"],
  "txSignals": [],
  "rxSignals": [],
  "communicationPartners": ["ADAS", "Cluster", "Gateway"]
}
```

### 15.3 Edge

```json
{
  "id": "ABS__ADAS",
  "source": "ABS",
  "target": "ADAS",
  "messages": ["256", "260"],
  "signals": ["VehicleSpeed.WheelSpeed_FL"],
  "messageCount": 2,
  "signalCount": 12,
  "hasReverseEdge": true
}
```

---

## 16. Handling DBC Edge Cases

### 16.1 Missing Nodes

Some DBC files may reference senders or receivers not listed in `BU_`.

Strategy:

- Include them as inferred nodes
- Add warning:

```text
Node 'ADAS' was referenced as signal receiver but not declared in BU_ section.
```

### 16.2 Vector__XXX Receiver

Many DBC files use `Vector__XXX` as a placeholder receiver.

Strategy:

- Include by default in raw data
- Hide by default in graph
- Add toggle: “Show placeholder nodes”

### 16.3 Multiple Receivers

A signal can have multiple receivers.

Strategy:

- Create one edge from sender to each receiver
- Store the same signal under each edge

### 16.4 Self-Receiver

Sometimes sender and receiver are identical.

Strategy:

- Hide self-loops by default
- Optional toggle to show self-loops

### 16.5 Multiplexed Signals

Multiplexing is common in DBC files.

Strategy:

MVP:

- Parse and display multiplexing metadata
- Do not visualize multiplex branches separately

Later:

- Add multiplex tree view inside message inspector

### 16.6 Extended CAN IDs

Strategy:

- Store decimal and hex representation
- Flag standard vs extended frame
- Allow search by both

### 16.7 Duplicate Message Names or Signal Names

Strategy:

- Use CAN ID as message ID internally
- Use `MessageName.SignalName` or `CANID.SignalName` as signal ID
- Show user-friendly name but keep stable internal IDs

---

## 17. Frontend State Model

Recommended frontend state:

```text
projectId
selectedNodeId
selectedEdgeId
selectedMessageId
selectedSignalId
searchQuery
activeFilters
visibleGraphMode
layoutMode
hiddenNodeIds
highlightedObjectIds
```

Use Zustand for a simple implementation:

```text
useProjectStore
useGraphStore
useSelectionStore
useFilterStore
```

---

## 18. Recommended Visualization Library

### Option A: React Flow

Pros:

- Very good React integration
- Nice custom nodes
- Good for polished UI
- Easy interaction handling
- Good for portfolio/demo apps

Cons:

- Very large graphs may need optimization
- Not primarily built for graph analytics

### Option B: Cytoscape.js

Pros:

- Built for graph visualization
- Good layout algorithms
- Better for larger networks
- Mature graph interactions

Cons:

- Less React-native feeling
- Custom UI components can feel less clean

### Recommendation

Use **React Flow** for MVP because it is easier to make visually polished.

Use Cytoscape.js later if graph size becomes a performance bottleneck.

---

## 19. MVP Feature Set

Version 0.1 should include:

- Upload `.dbc`
- Parse nodes/messages/signals
- Build ECU communication graph
- Interactive graph view
- Click node to inspect TX/RX messages
- Click edge to inspect messages/signals between two ECUs
- Search by ECU/message/signal/CAN ID
- Export graph JSON
- Demo DBC included in repo
- Docker Compose local start
- README with screenshots

Do **not** add CAN trace decoding in the MVP. Keep the first release focused and finished.

---

## 20. Version Roadmap

### v0.1 — DBC Structure Explorer

- Upload DBC
- Visualize logical ECU graph
- Node inspector
- Edge inspector
- Search
- Export graph JSON

### v0.2 — Message and Signal Deep Dive

- Message detail page
- Signal bit layout visualization
- Multiplexing display
- CSV export
- Better filtering

### v0.3 — Trace Overlay

- Upload CAN trace
- Decode frames using DBC
- Show active/inactive messages
- Show measured frequencies
- Signal timelines

### v0.4 — Compare Mode

- Upload two DBC files
- Compare added/removed/changed messages
- Compare signal scaling changes
- Compare receiver/sender changes
- Generate change report

### v0.5 — Saved Projects

- Save uploaded projects
- SQLite/PostgreSQL storage
- Project dashboard
- Sharing/export links

---

## 21. README Positioning

The README should start with a strong problem statement.

Example:

```markdown
# DBC Network Explorer

DBC Network Explorer turns CAN DBC files into interactive ECU communication maps.

Instead of manually reading message and signal definitions, engineers can upload a DBC file and immediately see which ECUs send messages, which ECUs receive signals, and how the logical communication network is connected.

This tool visualizes the logical communication graph derived from DBC transmitters and signal receivers. It does not claim to reconstruct the physical vehicle wiring topology.
```

Recommended README sections:

```text
1. Why this exists
2. Demo screenshot/GIF
3. Features
4. What a DBC can and cannot tell you
5. Quick start
6. Architecture
7. Parsing strategy
8. Roadmap
9. Development setup
10. License
```

---

## 22. Demo DBC Strategy

Include your own synthetic demo file.

Suggested demo ECUs:

```text
Gateway
EngineECU
TransmissionECU
ABS
EPS
ADAS
RadarFront
CameraFront
Cluster
Infotainment
BatteryManagement
BodyControl
```

Suggested messages:

```text
VehicleSpeed
WheelSpeeds
BrakeStatus
SteeringAngle
YawRate
EngineTorque
GearState
ACCStatus
LaneKeepingStatus
BatteryStatus
DoorStatus
DisplayWarnings
```

This lets you create a clean and impressive demo without relying on OEM data.

Also test with public DBCs from projects such as OpenDBC later.

---

## 23. Testing Strategy

### 23.1 Backend Tests

Test cases:

- Parses valid small DBC
- Extracts nodes from `BU_`
- Infers missing nodes from senders/receivers
- Extracts messages correctly
- Extracts signal receivers correctly
- Creates correct edges
- Hides placeholder receivers when requested
- Handles self-loops
- Handles extended IDs
- Handles multiplexed signals without crashing

### 23.2 Frontend Tests

Test cases:

- Upload screen renders
- Graph renders from mock API response
- Node click opens inspector
- Edge click opens inspector
- Search highlights matching objects
- Filters hide/show graph objects

### 23.3 Golden File Tests

Add a known demo DBC and expected JSON output.

```text
demo_vehicle.dbc
expected_graph.json
```

Then test:

```text
parse(demo_vehicle.dbc) == expected_graph.json
```

This is excellent for long-term parser reliability.

---

## 24. Production Quality Details

To make the repo look serious:

- Type-safe API schemas with Pydantic
- TypeScript types generated or manually mirrored
- Clear error handling for invalid DBC files
- Loading and empty states
- Docker Compose setup
- CI pipeline with backend and frontend tests
- Pre-commit formatting
- Screenshots in README
- Demo DBC
- Architecture documentation
- Small but clean issue templates

Recommended commands:

```bash
docker compose up --build
```

Backend:

```bash
cd backend
pytest
ruff check .
```

Frontend:

```bash
cd frontend
npm install
npm run dev
npm run test
npm run lint
```

---

## 25. Possible Name Ideas

Good names:

- DBC Network Explorer
- CAN Matrix Explorer
- DBC Graph
- CAN Topology Viewer
- SignalMap
- CANscape
- DBC Lens
- CAN Compass

Best professional name:

> DBC Network Explorer

Best short product-like name:

> DBC Lens

---

## 26. Final Recommendation

Start with a clean MVP:

```text
DBC upload
→ parse with cantools
→ build logical ECU communication graph
→ render interactive browser graph
→ inspect nodes, edges, messages, and signals
```

Avoid adding too many features at the beginning. The main value is the visual understanding of the network. Once that is polished, add trace decoding and DBC comparison as advanced features.

This project is a very good fit for an automotive engineering GitHub portfolio because it is domain-specific, useful, visual, and realistic to ship.
