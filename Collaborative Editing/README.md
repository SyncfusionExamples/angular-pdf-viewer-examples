# Collaborative Editing in Syncfusion Angular PDF Viewer

This sample demonstrates real-time collaborative editing in the Syncfusion Angular PDF Viewer. It uses the Syncfusion Collaborator client package with a Node.js Collaboration Server to synchronize PDF Viewer actions between users.

Users can collaborate on the same PDF room and see shared changes to:

- Annotations, such as comments, highlights, drawings, and stamps
- Form field interactions and value updates
- Page Organizer operations, such as page reordering and page changes

All users who need to collaborate must open the client with the same room ID.

## Prerequisites

- Node.js 14 or later
- npm
- A Redis instance reachable by the Collaboration Server
- Two or more browser tabs or windows for testing collaboration

## Project Structure

```text
Collaborative Editing/
├── Client/    # Angular PDF Viewer application
└── Server/    # Node.js Collaboration Server and PDF storage APIs
```

## Run the Sample Locally

Open two terminal windows from the `Collaborative Editing` folder.

### 1. Start the Collaboration Server

```bash
cd Server
npm install
npm start
```

The server listens on:

```text
http://localhost:8081
```

The client is configured to use this URL in `Client/src/app/app.ts` through the `SERVICE_URL` constant. If the server URL changes, update the client configuration to use the same URL.

### 2. Start the Angular Client

In a second terminal:

```bash
cd Client
npm install
npm start
```

Angular will display the local client URL, normally:

```text
http://localhost:4200
```

Open that URL in a browser.

## Test Collaborative Editing

1. Open the client in the first browser tab.
2. Confirm that the PDF Viewer toolbar includes the user/collaboration icon.
3. Copy the room ID from the browser URL or from the collaboration status bar. The room ID is the `id` query parameter, for example:

   ```text
   http://localhost:4200/?id=3tlfqgkp854
   ```

4. Open the client in another browser tab or window.
5. Replace its URL with the same room ID, for example:

   ```text
   http://localhost:4200/?id=3tlfqgkp854
   ```

6. Confirm that both users show the same room ID in the app bar.
7. Make changes from either session and verify that the other session receives them. Test annotations, form fields, and Page Organizer actions.

If no `id` is provided, the client generates a new room ID. Share the generated URL with other collaborators so that everyone joins the same room.

## Collaboration Notes

- The room ID identifies the shared collaboration session. Users with different room IDs are placed in different sessions.
- Keep the Collaboration Server running while testing real-time updates.
- The Collaboration Server uses Redis to persist and distribute collaboration actions. Ensure its Redis configuration is valid before starting the server.
- For a hosted deployment, configure the client with the hosted Collaboration Server URL and use a shared, reachable Redis instance. All users must access the same client deployment and preserve the same `?id=<room-id>` value to remain in one room.
- Do not use `localhost` in a hosted client configuration because it refers to each individual user's computer.

## Useful Commands

| Directory | Command | Description |
|---|---|---|
| `Server` | `npm install` | Install server dependencies |
| `Server` | `npm start` | Start the Collaboration Server on port 8081 |
| `Client` | `npm install` | Install client dependencies |
| `Client` | `npm start` | Start the Angular development server |
| `Client` | `npm run build` | Create a production client build |

## Troubleshooting

- **The client cannot connect:** Confirm that the server is running on port `8081` and that `SERVICE_URL` in `Client/src/app/app.ts` matches the server URL.
- **Users do not see each other's changes:** Confirm that every browser URL contains the same `id` value and that Redis is available to the server.
- **A new room appears unexpectedly:** Check that the URL includes `?id=<room-id>`. Without it, the client generates a new room ID.
