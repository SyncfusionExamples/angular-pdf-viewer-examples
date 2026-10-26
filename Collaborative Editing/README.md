# Collaborative Editing in Syncfusion Angular PDF Viewer

This sample demonstrates real-time collaborative editing in the Syncfusion Angular PDF Viewer. It uses the Syncfusion Collaborator client package with a Collaboration Server to synchronize PDF Viewer actions between users.

Users can collaborate on the same PDF room and see shared changes to:

- Annotations, such as comments, highlights, drawings, and stamps
- Form field interactions and value updates
- Page Organizer operations, such as page reordering and page changes

All users who need to collaborate must open the client with the same room ID.

## Prerequisites

- Node.js 14 or later **or** the .NET SDK 6.0 or later, depending on the Collaboration Server you choose
- npm
- A Redis instance reachable by the Collaboration Server
- Two or more browser tabs or windows for testing collaboration

## Choose a Collaboration Server

The sample supports two Collaboration Server implementations. Both expose the same service at the same port, so the only difference on the client side is the `connectionType` option.

| Option | Language | Transport | Client `connectionType` |
|---|---|---|---|
| Node.js Web Service | Node.js | WebSocket | `websocket` |
| ASP.NET Core Web Service | C# / ASP.NET Core | SignalR | `signalr` |

The server is part of the `Server` folder in this sample. Pick one implementation, run it on port `8081`, and point the client at it.

## Project Structure

```text
Collaborative Editing/
├── Client/    # Angular PDF Viewer application
└── Server/    # Collaboration Server (Node.js or ASP.NET Core) and PDF storage APIs
```

## Configure the Client

Open `Client/src/app/app.ts` and set the service URL to the server that is running. Keep the trailing slash.

```js
//REPLACE THIS WITH SERVICE URL CURRENTLY RUNNING
const SERVICE_URL = 'http://localhost:8081/';
```

The transport is selected by `connectionType` when the `CollaborationClient` is created:

```js
const client = new CollaborationClient(adapter, {
  serviceUrl: SERVICE_URL,
  // USE BELOW IF YOU USE NODE JS WEB SERVICE
  connectionType: 'websocket',
  // USE BELOW IF YOU USE CORE WEB SERVICE
  // connectionType: 'signalr',
  currentUser: currentUser,
  onUserJoined: (user) => {
    console.log('[App] User joined collaboration:', user);
    setConnectedUsers(prev => [...new Set([...prev, user.userName || user.currentUser])]);
  },
  onUserLeft: (user) => {
    console.log('[App] User left collaboration:', user);
    setConnectedUsers(prev => prev.filter(u => u !== (user.userName || user.currentUser)));
  }
});
```

- Running the **Node.js** server? Keep `connectionType: 'websocket'` and comment out the `signalr` line.
- Running the **ASP.NET Core** server? Comment out the `websocket` line and uncomment `connectionType: 'signalr'`.

## Run the Sample Locally

Open two terminal windows from the `Collaborative Editing` folder. The Collaboration Server and the Angular client must both be running.

### 1. Start the Collaboration Server

Pick **one** of the following.

#### Option A: Node.js Web Service

```bash
cd Server
npm install
npm start
```

The server listens on:

```text
http://localhost:8081
```

#### Option B: ASP.NET Core Web Service

```bash
cd Server
dotnet restore
dotnet build
dotnet run
```

The server listens on:

```text
http://localhost:8081
```

If the project does not use port `8081` by default, start it on that port explicitly:

```bash
dotnet run --urls http://localhost:8081
```

The client is configured to use this URL in `Client/src/app/app.ts` through the `SERVICE_URL` constant. If the server URL changes, update the client configuration to use the same URL, and make sure `connectionType` matches the server you started.

### 2. Start the Angular Client

In a second terminal:

```bash
cd Client
npm install
npm run dev
```

Vite will display the local client URL, normally similar to:

```text
http://localhost:5173
```

Open that URL in a browser.

## Test Collaborative Editing

1. Open the client in the first browser tab.
2. Confirm that the PDF Viewer toolbar includes the user/collaboration icon.
3. Copy the room ID from the browser URL or from the collaboration status bar. The room ID is the `id` query parameter, for example:

   ```text
   http://localhost:5173/?id=3tlfqgkp854
   ```

4. Open the client in another browser tab or window.
5. Replace its URL with the same room ID, for example:

   ```text
   http://localhost:5173/?id=3tlfqgkp854
   ```

6. Confirm that both users show the same room ID in the app bar.
7. Make changes from either session and verify that the other session receives them. Test annotations, form fields, and Page Organizer actions.

If no `id` is provided, the client generates a new room ID. Share the generated URL with other collaborators so that everyone joins the same room.

## Collaboration Notes

- The room ID identifies the shared collaboration session. Users with different room IDs are placed in different sessions.
- `connectionType` must match the server you are running. `websocket` is for the Node.js Web Service and `signalr` is for the ASP.NET Core Web Service.
- Keep the Collaboration Server running while testing real-time updates.
- The Collaboration Server uses Redis to persist and distribute collaboration actions. Ensure its Redis configuration is valid before starting the server.
- For a hosted deployment, configure the client with the hosted Collaboration Server URL and use a shared, reachable Redis instance. All users must access the same client deployment and preserve the same `?id=<room-id>` value to remain in one room.
- Do not use `localhost` in a hosted client configuration because it refers to each individual user's computer.

## Useful Commands

| Directory | Command | Description |
|---|---|---|
| `Server` (Node.js) | `npm install` | Install server dependencies |
| `Server` (Node.js) | `npm start` | Start the Collaboration Server on port 8081 |
| `Server` (ASP.NET Core) | `dotnet restore` | Restore server packages |
| `Server` (ASP.NET Core) | `dotnet build` | Build the Collaboration Server |
| `Server` (ASP.NET Core) | `dotnet run` | Start the Collaboration Server on port 8081 |
| `Server` (ASP.NET Core) | `dotnet run --urls http://localhost:8081` | Start the server on port 8081 explicitly |
| `Client` | `npm install` | Install client dependencies |
| `Client` | `npm run dev` | Start the Vite development server |
| `Client` | `npm run build` | Create a production client build |
| `Client` | `npm run lint` | Run the client linter |

## Troubleshooting

- **The client cannot connect:** Confirm that the server is running on port `8081` and that `SERVICE_URL` in `Client/src/app/app.ts` matches the server URL.
- **The client connects but no other user appears:** Confirm that `connectionType` in `Client/src/app/app.ts` matches the running server, `websocket` for the Node.js Web Service or `signalr` for the ASP.NET Core Web Service.
- **Users do not see each other's changes:** Confirm that every browser URL contains the same `id` value and that Redis is available to the server.
- **A new room appears unexpectedly:** Check that the URL includes `?id=<room-id>`. Without it, the client generates a new room ID.