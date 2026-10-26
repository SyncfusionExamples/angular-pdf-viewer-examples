# PDF Viewer Collaborative Editing Server (.NET)

A production-ready .NET implementation of the PDF Viewer Collaborative Editing Server, providing real-time collaborative PDF editing using Syncfusion EJ2 PDF Viewer and Redis.

## Features

✅ **Real-Time Synchronization**: WebSocket-based instant updates via SignalR  
✅ **Distributed State Management**: Redis-backed version history  
✅ **No Merge Complexity**: Last-write-wins strategy for simplicity  
✅ **Scalable Architecture**: Stateless design supports horizontal scaling  
✅ **Master Document Pattern**: Baseline PDF + operations = final state  
✅ **XFDF Annotation Support**: Full Adobe-compatible annotation format  
✅ **Form Field Management**: Create, update, delete fields dynamically  
✅ **Page Organizer**: Reorder, delete, rotate pages in real-time  

## Technology Stack

- **Framework**: .NET 8.0+
- **Server**: ASP.NET Core with SignalR
- **State Management**: Redis
- **PDF Library**: Syncfusion EJ2 PDF
- **Collaboration Framework**: Syncfusion Collaboration Core
- **Storage**: Local File System or Azure Blob Storage

## Project Structure

```
PdfViewerCollaborativeEditingServer/
├── Adapter/
│   └── PdfViewerCollaborationAdapter.cs    # Operation mapping and PDF manipulation
├── Controllers/
│   └── CollaborativeEditingController.cs   # REST API endpoints
├── Services/
│   ├── IPdfStorageService.cs               # Storage abstraction
│   ├── PdfStorageService.cs                # Local file storage
│   └── AzurePdfStorageService.cs           # Azure Blob storage
├── Properties/
│   └── launchSettings.json                 # Launch configuration
├── Program.cs                              # Dependency injection and middleware
├── appsettings.json                        # Configuration
└── appsettings.Development.json            # Development settings
```

## API Endpoints

All endpoints are accessible at `/api/CollaborativeEditing/`

### POST `/ImportFile`
Join a collaboration room and retrieve current state.

**Request:**
```json
{
  "roomName": "room123",
  "fileName": "document.pdf",
  "userName": "user@example.com",
  "connectionId": "conn-id-123"
}
```

**Response:**
```json
{
  "roomName": "room123",
  "version": 5,
  "operations": [
    {
      "type": "annotation",
      "data": { "xfdfData": "..." },
      "roomName": "room123",
      "connectionId": "conn-id-456"
    }
  ]
}
```

### POST `/UpdateAction`
Submit a collaborative editing action (annotation, form field, page organizer).

**Request:**
```json
{
  "roomName": "room123",
  "type": "annotation",
  "connectionId": "conn-id-123",
  "userName": "user@example.com",
  "currentVersion": 5,
  "data": {
    "action": "Add",
    "xfdfData": "<xfdf>...</xfdf>"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "annotation updated successfully",
  "data": { "action": "Add", "xfdfData": "..." }
}
```

### GET `/GetPDFDocument`
Retrieve a PDF document from storage.

**Query Parameters:**
- `fileName` (optional): PDF filename (default: "document.pdf")
- `roomName` (optional): Room identifier (default: "default")

**Response:**
```json
{
  "success": true,
  "fileName": "document.pdf",
  "roomName": "room123",
  "content": "JVBERi0xLjQK...",  // Base64 encoded PDF
  "contentLength": 45234,
  "isDefault": false
}
```

### POST `/SavePDFDocument`
Save a PDF document to storage.

**Request (multipart/form-data):**
- `pdfFile`: PDF file
- `roomName`: Room identifier

**Response:**
```json
{
  "success": true,
  "message": "PDF saved successfully",
  "filePath": "storage/pdfs/room123/document.pdf",
  "size": 45234
}
```

## Configuration

### appsettings.json

```json
{
  "ConnectionStrings": {
    "Redis": "localhost:6379"  // Redis connection string
  },
  "PdfStorage": {
    "StoragePath": "storage/pdfs",          // Local PDF storage path
    "DefaultPdfPath": "wwwroot/PDF/pdf-succinctly.pdf"  // Default PDF
  },
  "UseAzureStorage": false,                 // Enable Azure Blob Storage
  "AzureStorage": {
    "ConnectionString": "",                 // Azure connection string
    "ContainerName": "pdfs"                 // Container name
  }
}
```

### Redis Configuration

The server connects to Redis to store collaborative operations. Configure the connection string in `appsettings.json`.

**Example with Azure Cache for Redis:**
```
pdfviewercache.redis.cache.windows.net:6380,ssl=true,password=YOUR_PASSWORD
```

## Running the Server

### Prerequisites

- .NET 8.0 SDK or later
- Redis server (local or remote)
- Syncfusion NuGet packages

### Build and Run

```bash
# Restore packages
dotnet restore

# Build
dotnet build

# Run
dotnet run

# Run with specific configuration
dotnet run --configuration Development
```

The server will start at `http://localhost:5000` (HTTP) or `https://localhost:5001` (HTTPS).

### Verify Server is Running

```bash
curl http://localhost:5000/api/test
# Response: {"status":"PDF Viewer Collaboration Server Running"}
```

## Supported Operations

### Annotations
- **Add**: Add new annotations (highlights, comments, stamps, etc.)
- **Modify**: Update existing annotations
- **Delete**: Remove annotations

Supported annotation types:
- Highlight, Underline, Strikeout, Squiggly
- Square, Circle, Line, Polygon, Polyline
- FreeText, Ink (signatures), Stamp, Text, Redact

### Form Fields
- **Create**: Add new form fields (TextBox, CheckBox, RadioButton, ComboBox, ListBox, Signature)
- **Update**: Modify field values and properties
- **Delete**: Remove form fields

### Page Organizer
- **Reorder**: Change page order in document
- **Delete**: Remove pages
- **Rotate**: Rotate pages (90°, 180°, 270°)
- **Insert**: Add new pages
- **Copy**: Copy pages from other documents

## Operation Flow

1. **Client Joins Room**
   - Client calls `/ImportFile`
   - Server returns current state from Redis
   - Client initializes PDF with master document + operations

2. **Client Makes Changes**
   - Client detects local changes
   - Sends to server via `/UpdateAction`

3. **Server Processes Update**
   - Validates and stores operation in Redis
   - Broadcasts to other clients in room
   - Returns success confirmation

4. **Other Clients Receive Update**
   - Receive notification via WebSocket
   - Apply operation to local PDF
   - Update UI

5. **Save to Storage**
   - When save threshold is reached or explicitly requested
   - Server replays all operations from Redis
   - Updates PDF with all changes
   - Persists to storage (local or Azure)
   - Cleans up Redis

## Architecture Overview

### Request Processing Lifecycle

```
Client Request
    ↓
CollaborativeEditingController.UpdateAction()
    ↓
IActionService.AddOperationAsync()
    ├─ Store operation in Redis
    └─ Assign version number
    ↓
PdfViewerCollaborationAdapter.MapGenericToControlAction()
    ├─ Convert to client format
    └─ Prepare for broadcast
    ↓
IActiveTransport.SendToGroupAsync()
    └─ Broadcast via WebSocket to room
    ↓
Clients Receive Update
    ├─ Filter by connectionId
    ├─ Parse operation
    ├─ Apply to local PDF
    └─ Update UI
```

### State Management

**Master Document**: Baseline PDF stored in file system or Azure  
**Operations**: Individual changes stored as versioned entries in Redis  
**Merged State**: Master + operations = current document state  

When saving:
1. Load master PDF
2. Retrieve all pending operations from Redis
3. Replay operations via `PdfViewerCollaborationAdapter.ReplayOperationsAndUpdateDocumentAsync()`
4. Persist updated PDF
5. Clear Redis (full or partial based on save mode)

## Comparison with Node.js Implementation

This .NET implementation maintains feature parity with the Node.js server:

| Feature | Node.js | .NET |
|---------|---------|------|
| Annotation Import/Export | ✅ XFDF parsing | ✅ XML parsing |
| Form Field Management | ✅ Create/Update/Delete | ✅ Create/Update/Delete |
| Page Organizer | ✅ Reorder/Delete/Rotate | ✅ Reorder/Delete/Rotate |
| Redis Integration | ✅ Node Redis | ✅ StackExchange.Redis |
| Real-time Broadcasting | ✅ Socket.IO | ✅ SignalR |
| Storage Options | ✅ Local/Azure | ✅ Local/Azure |
| Master Document Pattern | ✅ | ✅ |
| Last-Write-Wins Strategy | ✅ | ✅ |

## Error Handling

The server includes comprehensive error handling:

- **Invalid Requests**: Returns 400 with error message
- **Not Found**: Returns 404 for missing resources
- **Server Errors**: Returns 500 with error details
- **Operation Failures**: Logged but don't block other operations
- **Storage Errors**: Fallback to defaults where possible

## Logging

Logs are written to console and configured via `appsettings.json`. Log levels:

- `Information`: Normal operation flow
- `Warning`: Non-critical issues
- `Error`: Critical issues affecting functionality

Log messages include prefixes like `[ImportFile]`, `[UpdateAction]`, `[PdfStorage]` for easy filtering.

## Performance Considerations

- **Stateless Design**: Horizontal scaling via multiple server instances
- **Redis Caching**: Reduces database queries
- **Operation Batching**: Save threshold batches operations before persistence
- **Async/Await**: Non-blocking I/O for concurrent requests
- **Connection Pooling**: Redis connection pooling for efficiency

## Security Notes

- CORS is enabled for all origins (configure as needed in production)
- No authentication implemented (add as needed)
- PDF files stored in configurable paths
- Connection strings should be in secure configuration management
- SSL/TLS should be enabled for production

## Troubleshooting

### Redis Connection Error
```
Error: "Unable to connect to Redis"
```
**Solution**: Verify Redis is running and connection string is correct in `appsettings.json`

### PDF Not Found
```
Error: "PDF document not found"
```
**Solution**: Check `PdfStorage:StoragePath` and `PdfStorage:DefaultPdfPath` in configuration

### Operations Not Syncing
```
Annotations/Form fields not appearing on other clients
```
**Solution**: Check WebSocket connection and SignalR mapping in `Program.cs`

## Production Deployment

1. **Build Release**: `dotnet publish -c Release`
2. **Configure**: Update `appsettings.json` for production environment
3. **Redis**: Use Azure Cache for Redis or self-hosted Redis
4. **HTTPS**: Enable SSL/TLS for all connections
5. **Logging**: Configure centralized logging (Application Insights, ELK, etc.)
6. **Scaling**: Deploy multiple instances behind load balancer
7. **Monitoring**: Monitor Redis connection, operation latency, storage space

## License

Syncfusion community license - Follow Syncfusion licensing terms.

## Support

For issues and questions:
- Check the [Syncfusion Documentation](https://www.syncfusion.com/documentation/pdf-viewer)
- Review [Node.js Implementation](../server.js) for reference
- Check logs for detailed error information
