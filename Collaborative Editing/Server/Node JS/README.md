# PDF Viewer Collaboration Server (Node.js)

A robust Node.js server implementation for real-time PDF collaborative editing, featuring version-based state management, multi-user support, and Redis-backed action persistence.

## 📋 Quick Start

### Prerequisites
- **Node.js** v14+ (v16+ recommended)
- **npm** v6+
- **Redis** (local or cloud-hosted)
- **@syncfusion/ej2-collaborator-server** package

### Installation

1. **Navigate to the project directory:**
```bash
cd NodeJSServer
```

2. **Install dependencies:**
```bash
npm install
```

3. **Configure Redis connection** in `server.js`:
```javascript
redis: {
    host: 'your-redis-host',
    port: 6380,
    username: 'default',
    password: 'your-redis-password',
    tls: {}
}
```

> **For Azure Redis**: Use port `6380` with `tls: {}` enabled.

4. **Start the server:**
```bash
npm start
```

### Expected Output
```
***** NODE BUILD 2026-07-23 *****
***** PDF Viewer Collaboration Server *****
ActionService initialized: true
```

The server will start on `http://localhost:8080`

---

## ⚠️ Important: Correct API Endpoint Format

When making requests to this server, **use the exact endpoint paths with proper casing**:

### ✅ **CORRECT** Endpoint Pattern
```
http://localhost:8080/api/CollaborativeEditing/ImportFile
http://localhost:8080/api/CollaborativeEditing/UpdateAction
```

### ❌ **INCORRECT** (will not work)
```
http://localhost:8080/api/collaboration/ImportFile        ← lowercase won't work
http://localhost:8080/api/Collaboration/ImportFile       ← wrong casing
http://localhost:8080/api/collaborative-editing/ImportFile ← hyphenated won't work
```

**Key Point**: The endpoint is **`CollaborativeEditing`** (capital C and capital E), not `collaboration` or `collaborative-editing`.

---

## 🏗️ Project Architecture

### File Structure
```
NodeJSServer/
├── adapters/
│   └── PdfViewerCollaborationAdapter.js    # Business logic & data transformation
├── controllers/
│   └── collaborative-editing-controller.js # HTTP request handling & orchestration
├── server.js                               # Server initialization & setup
├── package.json                            # Dependencies & scripts
├── README.md                               # This file
├── IMPLEMENTATION_GUIDE.md                 # Detailed API documentation
├── MIGRATION_SUMMARY.md                    # .NET to Node.js migration details
├── CHANGELOG.md                            # Version history
└── DIFFERENCES.md                          # Document Editor vs PDF Viewer differences
```

### Architecture Pattern

```
┌─────────────────────────────────────────────────────────┐
│                    PDF Viewer Client                     │
└────────────────┬──────────────────────────────────────────┘
                 │
        ┌────────▼────────────────┐
        │  HTTP Endpoints:        │
        │ - /ImportFile           │
        │ - /UpdateAction         │
        │ - /GetActionsFromServer │
        │ - /SaveRequest          │
        └────────┬────────────────┘
                 │
        ┌────────▼─────────────────────────────────────┐
        │ CollaborativeEditingController               │
        │ (Request validation & orchestration)         │
        │                                              │
        │ Routes:                                      │
        │ - POST /ImportFile         → Get snapshots   │
        │ - POST /UpdateAction       → Store & broadcast
        │ - POST /GetActionsFromServer → Get history   │
        │ - POST /SaveRequest        → Cleanup Redis   │
        └────────┬──────────────────────────────────────┘
                 │
        ┌────────▼──────────────────────────────────────┐
        │ PdfViewerCollaborationAdapter                │
        │ (Business logic & transformations)           │
        │                                              │
        │ Methods:                                     │
        │ - mapControlToGenericAction()               │
        │ - mapGenericToControlAction()               │
        │ - transformOperations()                     │
        │ - processSaveRequestAsync()                 │
        │ - notifySaveCompletion()                    │
        └────────┬──────────────────────────────────────┘
                 │
        ┌────────▼───────────────────────────────┐
        │ CollaborationServer Infrastructure     │
        │ (ActionService, Redis, Transport)      │
        │                                        │
        │ - ActionService: CRUD for actions     │
        │ - Redis: Persistent storage           │
        │ - Transport: WebSocket communication  │
        └────────┴───────────────────────────────┘
```

---

## 🔄 Action Types & Request Format

The server supports four collaborative action types, all following the unified `CollaborativeEditingRequest` format:

### Base Request Structure
```javascript
{
  roomName: string,           // Collaboration room identifier
  connectionId: string,       // Client connection ID
  userName: string,           // User performing the action
  currentVersion: number,     // Client-side version number
  type: string,               // Action type: annotation|formField|formFieldAction|pageOrganizer
  data: object                // Type-specific data
}
```

### 1. **Annotation** - XFDF-based Annotation Changes
```javascript
{
  roomName: "room123",
  connectionId: "conn-456",
  userName: "Alice",
  type: "annotation",
  currentVersion: 5,
  data: {
    xfdfData: "<xfdf>...</xfdf>"    // Required: Complete XFDF markup
  }
}
```

**Use Cases:**
- Add/modify comments, highlights, underlines
- Handwritten annotations
- Drawing markups
- Stamp additions

---

### 2. **FormField** - Single Form Field Value Update
```javascript
{
  roomName: "room123",
  connectionId: "conn-456",
  userName: "Alice",
  type: "formField",
  currentVersion: 5,
  data: {
    jsonData: "{\"field1\": \"value1\", \"field2\": \"value2\"}"  // Required: JSON string
  }
}
```

**Use Cases:**
- Update individual form field values
- Standalone field modifications
- Quick value changes

---

### 3. **FormFieldAction** - Form Field Creation/Update/Deletion
```javascript
{
  roomName: "room123",
  connectionId: "conn-456",
  userName: "Alice",
  type: "formFieldAction",
  currentVersion: 5,
  data: {
    changes: "{\"add\": [...], \"update\": [...], \"delete\": [...]}"  // Required: JSON string
  }
}
```

**Use Cases:**
- Create new form fields
- Batch field operations
- Field property changes
- Field deletion

---

### 4. **PageOrganizer** - Page Order, Rotation, Deletion
```javascript
{
  roomName: "room123",
  connectionId: "conn-456",
  userName: "Alice",
  type: "pageOrganizer",
  currentVersion: 5,
  data: {
    pages: [0, 2, 1],              // Reordered page indices
    rotations: {"0": 90, "2": 180} // Page rotations in degrees
  }
}
```

**Use Cases:**
- Reorder pages
- Rotate pages
- Delete pages
- Reorganize document structure

---

## 📡 API Endpoints

### 1. **POST /api/CollaborativeEditing/ImportFile**
Import/join a collaboration room and retrieve current state snapshots.

**Correct URL:**
```
http://localhost:8080/api/CollaborativeEditing/ImportFile
```

**Request:**
```javascript
{
  roomName: "room123",
  fileName: "document.pdf"
}
```

**Curl Example:**
```bash
curl -X POST http://localhost:8080/api/CollaborativeEditing/ImportFile \
  -H "Content-Type: application/json" \
  -d '{
    "roomName": "room123",
    "fileName": "document.pdf"
  }'
```

**Response:**
```javascript
{
  status: "success",
  roomName: "room123",
  fileName: "document.pdf",
  currentVersion: 5,
  annotations: {
    snapshot: "<xfdf>...</xfdf>",  // Latest XFDF snapshot
    version: 5
  },
  formFields: {
    snapshot: "{...}",              // Merged form field state
    version: 5
  },
  pageOrganizer: {
    snapshot: {...},                // Latest page organizer state
    version: 5
  }
}
```

---

### 2. **POST /api/CollaborativeEditing/UpdateAction**
Handle all collaborative update actions (annotation, formField, formFieldAction, pageOrganizer).

**Correct URL:**
```
http://localhost:8080/api/CollaborativeEditing/UpdateAction
```

**Request:**
```javascript
{
  roomName: "room123",
  connectionId: "conn-456",
  userName: "Alice",
  type: "annotation",              // or "formField", "formFieldAction", "pageOrganizer"
  currentVersion: 5,
  data: {
    xfdfData: "<xfdf>...</xfdf>"   // Type-specific data
  }
}
```

**Curl Example:**
```bash
curl -X POST http://localhost:8080/api/CollaborativeEditing/UpdateAction \
  -H "Content-Type: application/json" \
  -d '{
    "roomName": "room123",
    "connectionId": "conn-456",
    "userName": "Alice",
    "type": "annotation",
    "currentVersion": 5,
    "data": {
      "xfdfData": "<xfdf>...</xfdf>"
    }
  }'
```

**Response:**
```javascript
{
  status: "success",
  roomName: "room123",
  version: 6,
  message: "Action stored and broadcast"
}
```

**Error Response:**
```javascript
{
  status: "error",
  message: "Invalid action type: xyz",
  roomName: "room123"
}
```

---

### 3. **POST /api/CollaborativeEditing/GetActionsFromServer**
Retrieve pending actions from a specific version onward.

**Request:**
```javascript
{
  roomName: "room123",
  fromVersion: 3  // Get actions from version 3 onwards
}
```

**Response:**
```javascript
{
  status: "success",
  roomName: "room123",
  fromVersion: 3,
  currentVersion: 6,
  actions: [
    {
      version: 4,
      connectionId: "conn-456",
      userName: "Alice",
      type: "annotation",
      timestamp: "2026-09-04T10:30:00Z",
      data: {...}
    },
    // ... more actions
  ]
}
```

---

### 4. **POST /api/CollaborativeEditing/SaveRequest**
Process save request and manage Redis action cleanup.

**Request:**
```javascript
{
  roomName: "room123",
  connectionId: "conn-456",
  saveType: "full",      // or "partial"
  partialSave: true      // true for incremental, false for complete cleanup
}
```

**Response:**
```javascript
{
  status: "success",
  roomName: "room123",
  message: "Save request processed",
  actionsRemoved: 2,
  remainingActions: 3
}
```

---

### 5. **GET /api/test**
Health check endpoint.

**Response:**
```javascript
{
  status: "PDF Viewer Collaboration Server Running"
}
```

---

## 🔐 Configuration

### Redis Configuration (`server.js`)

```javascript
redis: {
    host: 'your-host',              // Redis host/endpoint
    port: 6380,                     // Redis port (6380 for Azure)
    username: 'default',            // Redis username
    password: 'your-password',      // Redis password
    tls: {}                         // Enable TLS for secure connections
}
```

### Save Threshold Configuration

The `SaveThreshold` setting controls how many actions are removed during a partial save:

```javascript
// Set in environment or server config
SaveThreshold: 2  // Remove first 2 actions on partial save
```

**Behavior:**
- **Partial Save**: Removes first N actions (N = SaveThreshold), retains remaining
- **Full Save**: Removes ALL actions for the room

---

## 🔄 Request/Response Flow

### Typical Collaboration Session

```
1. Client Connects
   ├─ POST /ImportFile
   ├─ Receives: Latest snapshots + version number
   └─ Joins room with connection ID

2. Client Makes Change
   ├─ POST /UpdateAction (e.g., add annotation)
   ├─ Server stores action in Redis
   ├─ Server broadcasts to other clients via WebSocket
   └─ Returns updated version number

3. Client Polls for Updates
   ├─ POST /GetActionsFromServer (fromVersion: 5)
   ├─ Server returns actions 6, 7, 8, ...
   └─ Client applies updates to local state

4. Client Saves
   ├─ Client creates final PDF blob via saveAsBlob()
   ├─ Client uploads PDF via separate endpoint
   ├─ POST /SaveRequest (partialSave: true)
   ├─ Server removes processed actions from Redis
   └─ Returns confirmation

5. Session End
   ├─ POST /SaveRequest (partialSave: false)
   └─ Server clears all pending actions
```

---

## 📊 State Management

### Version-Based Approach

- **No Merge Logic**: Each action is stored and broadcast independently
- **Last-Write-Wins**: For page organizer (only latest state matters)
- **Snapshots**: For annotations and form fields (complete state at version)
- **Incremental Sync**: Clients fetch actions from their last known version

### Storage Pattern

```
Redis Hash: `{roomName}:actions`
├─ Version: Auto-incrementing counter
├─ Action 1: { version: 1, data: {...}, user: "Alice", timestamp: ... }
├─ Action 2: { version: 2, data: {...}, user: "Bob", timestamp: ... }
└─ Action 3: { version: 3, data: {...}, user: "Alice", timestamp: ... }
```

---

## 🚀 Testing the Server

### 1. Health Check
```bash
curl -X GET http://localhost:8080/api/test
```

**Expected Output:**
```json
{
  "status": "PDF Viewer Collaboration Server Running"
}
```

### 2. Import File (Start Collaboration)
```bash
curl -X POST http://localhost:8080/api/CollaborativeEditing/ImportFile \
  -H "Content-Type: application/json" \
  -d '{
    "roomName": "test-room-001",
    "fileName": "sample.pdf"
  }'
```

### 3. Update Action (Send Change)
```bash
curl -X POST http://localhost:8080/api/CollaborativeEditing/UpdateAction \
  -H "Content-Type: application/json" \
  -d '{
    "roomName": "test-room-001",
    "connectionId": "conn-123",
    "userName": "TestUser",
    "type": "annotation",
    "currentVersion": 0,
    "data": {
      "xfdfData": "<xfdf><annots><text></text></annots></xfdf>"
    }
  }'
```

### 4. Get Actions (Retrieve Changes)
```bash
curl -X POST http://localhost:8080/api/CollaborativeEditing/GetActionsFromServer \
  -H "Content-Type: application/json" \
  -d '{
    "roomName": "test-room-001",
    "fromVersion": 0
  }'
```

---

## 📝 Important Notes

### Adapter Pattern
- **Controller**: Handles HTTP requests, validation, and orchestration
- **Adapter**: Implements business logic, data transformation, and state management
- **ActionService**: Manages CRUD operations on Redis-backed actions

### No Merge Logic
Unlike Document Editor (OT-based merging), PDF Viewer:
- Stores each action independently
- Broadcasts complete request envelope
- Clients filter responses by `connectionId`
- Page organizer uses last-write-wins

### Save Workflow
1. Client captures final PDF state via `saveAsBlob()`
2. Client uploads PDF to backend
3. Client sends `SaveRequest` to cleanup Redis
4. Server removes processed actions based on `partialSave` flag
5. Server broadcasts `saveCompleted` event

### Scoped Service Access
The `IActionService` is registered as SCOPED by `CollaborationServer`, but the adapter is a SINGLETON:
```javascript
// Correct: Use service scope factory
const scope = this.scopeFactory.CreateScope();
const actionService = scope.ServiceProvider.GetService(IActionService);
```

---

## 🐛 Troubleshooting

### Server Won't Start
- **Check Redis connection**: Verify Redis host, port, and credentials
- **Check Node.js version**: Use v14+ (v16+ recommended)
- **Install dependencies**: Run `npm install`

### Actions Not Persisting
- **Verify Redis**: Ensure Redis server is running and accessible
- **Check Redis credentials**: Confirm password and connection settings
- **Monitor logs**: Look for connection errors in console output

### WebSocket Disconnects
- **Check network**: Ensure client and server can communicate
- **Firewall rules**: Verify ports 8080 and 6380 are accessible
- **TLS certificate**: For Azure Redis, ensure TLS is enabled

### Performance Issues
- **Monitor Redis memory**: High memory usage slows down operations
- **Adjust SaveThreshold**: Smaller values = more frequent cleanup
- **Check network latency**: High latency increases action delivery time

---

## 📚 Additional Resources

- **IMPLEMENTATION_GUIDE.md**: Detailed API documentation
- **MIGRATION_SUMMARY.md**: .NET to Node.js migration details
- **DIFFERENCES.md**: Document Editor vs PDF Viewer patterns
- **CHANGELOG.md**: Version history and release notes

---

## 🔄 Development Workflow

### Local Development
```bash
# Start server with automatic reload (requires nodemon)
npm install -g nodemon
nodemon server.js

# Or manually restart
npm start
```

### Adding New Action Types
1. Update `collaborative-editing-controller.js` to validate new type
2. Implement type-specific snapshot logic in controller
3. Update adapter's `mapControlToGenericAction()` if needed
4. Document in IMPLEMENTATION_GUIDE.md

### Debugging
```javascript
// Enable verbose logging in adapter
console.log('Action stored:', JSON.stringify(action, null, 2));
console.log('Redis operation:', roomName, version);
```

---

## 📄 License

ISC (see package.json)

---

**Last Updated**: 2026-09-04  
**Server Build**: 2026-07-23  
**Node.js Requirement**: v14.0.0+
