/**
 * Collaborative Editing Controller for PDF Viewer.
 * Implements version-based state management matching Document Editor pattern.
 * 
 * Key characteristics:
 * - No merge logic (removed XfdfMergeHelper)
 * - Unified request/response format
 * - Broadcast original request to other clients
 * - Last-write-wins for page organizer, snapshots for annotations
 */

function registerRoutes(app, actionService, adapter, transport) {
    /**
     * Import/join a collaboration room - returns current state snapshots.
     * 
     * Returns the latest version of:
     * - Annotations (XFDF snapshot)
     * - Form fields (merged from all formField-type actions)
     * - Page organizer (latest single state)
     */
    app.post('/api/CollaborativeEditing/ImportFile', async (req, res) => {
        try {
            const { roomName, fileName, userName, connectionId, currentUser   } = req.body;

            if (!roomName) {
                return res.status(400).json({ error: 'Room name is required' });
            }

            // Get all pending operations for this room
            const allActions = await actionService.getPendingOperations(roomName, 0, -1);

            // Return raw operations - client handles filtering/reconstruction
            const operations = (allActions || []).map((x) =>
                adapter.mapGenericToControlAction(x)
            );

            return res.json({ roomName, version: allActions.length, operations });
        } catch (e) {
            console.error('[ImportFile] Error:', e.message);
            return res.status(500).json({
                error: 'Failed to import file',
                details: e.message
            });
        }
    });

    /**
     * Unified API for all collaborative update actions.
     * 
     * Handles all action types:
     * - "annotation": XFDF-based annotation changes
     * - "formField": Single form field value update
     * - "formFieldAction": Form field creation/update/deletion
     * - "pageOrganizer": Page order, rotation, etc.
     * 
     * Flow:
     * 1. Validate RoomName and Type
     * 2. Extract and validate type-specific data
     * 3. Convert to CollaborationAction via adapter
     * 4. Store in Redis
     * 5. Broadcast clean request with strongly-typed data to other clients
     */
    app.post('/api/CollaborativeEditing/UpdateAction', async (req, res) => {
        try {
            const request = req.body;

            if (!request.roomName) {
                return res.status(400).json({ error: 'RoomName is required' });
            }

            if (!request.type) {
                return res.status(400).json({ error: 'Type is required' });
            }

            let data = null;
            let actionDescription = '';
            const timestamp = new Date().toISOString();

            // Validate and extract type-specific data
            switch (request.type) {
                case 'annotation': {
                    const annotationData = request.data;
                    if (!annotationData || !annotationData.xfdfData) {
                        return res.status(400).json({
                            error: 'Data.xfdfData is required for annotation type'
                        });
                    }
                    data = annotationData;
                    actionDescription = 'Annotation updated';
                    break;
                }

                case 'formField': {
                    const formFieldData = request.data;
                    if (!formFieldData || !formFieldData.jsonData) {
                        return res.status(400).json({
                            error: 'Data.jsonData is required for formField type'
                        });
                    }
                    data = formFieldData;
                    actionDescription = 'Form field updated';
                    break;
                }

                case 'formFieldAction': {
                    const formFieldActionData = request.data;
                    if (!formFieldActionData || !formFieldActionData.changes) {
                        return res.status(400).json({
                            error: 'Data.changes is required for formFieldAction type'
                        });
                    }

                    // Validate changes JSON format
                    let changesObj;
                    try {
                        changesObj = JSON.parse(formFieldActionData.changes);
                        if (!changesObj) {
                            return res.status(400).json({
                                error: 'Invalid changes JSON format'
                            });
                        }
                    } catch (ex) {
                        return res.status(400).json({
                            error: 'Failed to parse changes JSON',
                            details: ex.message
                        });
                    }

                    data = formFieldActionData;
                    actionDescription = 'Form field action updated';
                    break;
                }

                case 'pageOrganizer': {
                    if (!request.data) {
                        return res.status(400).json({
                            error: 'Data is required for pageOrganizer type'
                        });
                    }
                    data = request.data;
                    actionDescription = 'Page organizer updated';
                    break;
                }

                default:
                    return res.status(400).json({
                        error: `Invalid action type: ${request.type}`
                    });
            }

            // Unified logging
            let action = request.data.action;
            if (request.type === 'pageOrganizer' && typeof request.data === 'string') {
                const parsedData = JSON.parse(request.data);
                action = parsedData.map(item => item.action).join(', ');
            }
            console.log(`ConnectionId: ${request.connectionId} | RoomName: ${request.roomName} | Data Type: ${request.type} | Action: ${action}`);

            // Convert to CollaborationAction
            const collaborationAction = adapter.mapControlToGenericAction(request);

            // Store in Redis
            await actionService.addOperation(collaborationAction, adapter);

            // Get all pending operations for this room
            const allActions = await actionService.getPendingOperations(request.roomName, 0, -1);

            // Broadcast: Reconstruct a clean request with strongly-typed data
            // This ensures the transport layer receives properly formatted data that serializes correctly
            const broadcastRequest = {
                roomName: request.roomName,
                connectionId: request.connectionId,
                userName: request.userName,
                type: request.type,
                currentVersion: request.currentVersion,
                data: data
            };

            // Broadcast to other clients in room
            // Clients filter via connectionId to ignore their own updates
            if (transport && typeof transport.broadcastToRoom === 'function') {
                try {
                    await transport.broadcastToRoom(
                        request.roomName,
                        {
                            event: 'action',
                            data: broadcastRequest
                        }
                    );
                } catch (broadcastError) {
                    console.error('[UpdateAction] Broadcast error:', broadcastError.message);
                    // Continue even if broadcast fails - action is already stored
                }
            }

            return res.json({
                success: true,
                message: actionDescription,
                data: data
            });
        } catch (e) {
            console.error('[UpdateAction] Error:', e.message, e.stack);
            return res.status(500).json({
                error: 'Failed to update action',
                details: e.message
            });
        }
    });
}

/**
 * Register PDF Document Management routes.
 * 
 * Handles PDF storage and retrieval for collaboration rooms.
 * Provides fallback to default PDF when room-specific document is unavailable.
 */
function registerPdfDocumentRoutes(app, pdfStorageService) {
    /**
     * Retrieve a stored PDF document as Base64 encoded content.
     * 
     * Used by clients to:
     * - Download finalized collaborative documents
     * - Verify document state before uploading updates
     * - Archive document versions
     * 
     * Query Parameters:
     * - fileName (optional): PDF file name. Defaults to "document.pdf"
     * - roomName (optional): Collaboration room identifier. Defaults to "default"
     * 
     * Response:
     * {
     *   "success": true,
     *   "fileName": "document.pdf",
     *   "roomName": "room123",
     *   "content": "JVBERi0xLjQKJeLjz9M...",  // Base64 encoded PDF
     *   "contentLength": 45234,
     *   "isDefault": false
     * }
     * 
     * If document not found in room storage, returns default PDF with isDefault: true
     */
    app.get('/api/CollaborativeEditing/GetPDFDocument', async (req, res) => {
        try {
            const { fileName, roomName } = req.query;

            if (!pdfStorageService) {
                return res.status(500).json({
                    success: false,
                    error: 'PDF Storage Service not initialized'
                });
            }

            // Get PDF (with fallback to default)
            const result = await pdfStorageService.getPdfAsync(fileName, roomName);

            if (!result.success) {
                return res.status(404).json(result);
            }

            return res.json(result);
        } catch (error) {
            console.error('[GetPDFDocument] Error:', error.message);
            return res.status(500).json({
                success: false,
                error: 'Failed to retrieve PDF',
                details: error.message
            });
        }
    });
}

module.exports = {
    registerRoutes,
    registerPdfDocumentRoutes
};