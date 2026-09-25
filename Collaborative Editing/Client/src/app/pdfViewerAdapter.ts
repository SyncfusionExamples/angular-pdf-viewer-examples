
import {
    PdfViewer, CollaborativeEditingHandler
} from '@syncfusion/ej2-angular-pdfviewer';
import { ICollaborationProvider, ICollaborationActionData } from '@syncfusion/ej2-collaborator';

export class PdfViewerAdapter implements ICollaborationProvider {
    private collaborativeEditingHandler: CollaborativeEditingHandler;
    private fileName: string = '';
    public currentRoomName: string = '';
    private isDocumentLoaded: boolean = false;
    private currentUser: string = '';
    private pendingOperations: any;

    constructor(
        private viewer: PdfViewer,
        private serviceUrl: string,
        currentUser: string
    ) {
        this.currentUser = currentUser;

        // Initialize the source-level collaboration handler
        this.collaborativeEditingHandler = new CollaborativeEditingHandler(
            viewer,
            currentUser
        );

    }

    /**
     * Fetches the document from the product's REST API and joins a collaboration room.
     * Returns the room name to be used by `client.open(...)`.
     * 
     * Flow:
     * 1. Generate or extract room name from URL
     * 2. POST to ImportFile endpoint with roomName
     * 3. Server returns all pending operations for state reconstruction
     * 4. Initialize collaboration context with room info and version
     * 5. Apply initial state snapshots (annotations, form fields, etc.)
     * 
     * @param fileName - Optional file name to load
     * @returns - Promise that resolves to the room name
     */
    public async loadFromServer(fileName?: string): Promise<string> {
        this.isDocumentLoaded = false;
        this.fileName = fileName || 'document.pdf';

        const roomName: string = this.getRoomName();
        this.currentRoomName = roomName;

        try {

            const response = await fetch(
                `${this.serviceUrl}api/CollaborativeEditing/ImportFile`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        roomName: roomName,
                        fileName: this.fileName,
                        currentUser: this.currentUser
                    })
                }
            );

            if (!response.ok) {
                throw new Error(
                    `Failed to join collaboration room: ${response.statusText}`
                );
            }

            const responseText: string = await response.text();
            await this.open(responseText, roomName);

            return roomName;
        } catch (error) {
            console.error('[PdfViewerAdapter] Error loading from server:', error);
            throw error;
        }
    }

    /**
     * Initializes collaboration context and applies initial document state.
     * 
     * Process:
     * 1. Parse server response containing version and pending operations
     * 2. Update handler with room info and version tracking
     * 3. Apply initial state snapshots (annotations, form fields, page organizer)
     * 4. Mark document as loaded for subsequent operations
     * 
     * @param responseText - JSON response text from ImportFile endpoint
     * @param roomName - Current collaboration room name
     */
    public async open(responseText: string, roomName: string): Promise<void> {
        try {
            const data: any = JSON.parse(responseText);

            // Extract version for document state
            const version = data.version || data.currentVersion || 0;

            // Update collaboration handler with room info and version tracking
            this.collaborativeEditingHandler.updateRoomInfo(
                roomName,
                version,
                `${this.serviceUrl}api/CollaborativeEditing/`
            );

            // Apply initial state: annotations, form fields, page organizer snapshots
            // These are stored as snapshots, not incremental operations
            this.pendingOperations = data.operations;
            if (data.operations && data.operations.length > 0) {
                for (const op of data.operations) {
                    this.collaborativeEditingHandler.applyRemoteAction(op.type, op);
                }
            }

            this.isDocumentLoaded = true;
        } catch (error) {
            console.error('[PdfViewerAdapter] Error initializing document:', error);
            throw error;
        }
    }

    /**
     * Sends local changes to the collaboration service via UpdateAction endpoint.
     * 
     * Flow:
     * 1. Validate operations array
     * 2. Delegate to handler for routing by operation type
     * 3. Handler increments version and sends to UpdateAction endpoint
     * 4. Server broadcasts operation to other clients (except sender)
     * 
     * @param operations - Array of operations/changes from the local user
     */
    public async sendActionToServer(operations: any[]): Promise<void> {
        try {
            if (!operations || operations.length === 0) {
                console.warn('[PdfViewerAdapter] No operations to send');
                return;
            }

            // Delegate to handler which manages routing and UpdateAction API calls
            await this.collaborativeEditingHandler.sendActionToServer(operations);
        } catch (error) {
            console.error('[PdfViewerAdapter] Error sending operations:', error);
            throw error;
        }
    }

    /**
     * Applies remote changes received from other collaborators.
     * Delegates all logic to the source-level collaborative editing handler.
     *
     * @param action - Type of action being applied (e.g., 'annotationUpdate', 'formFieldUpdate', 'removeUser')
     * @param obj - Object containing action data
     */
    public applyRemoteAction(action: string, data: ICollaborationActionData): void {
        if (
            action === 'addUser') {
            if ((data as any).payload.length > 0) {
                ((data as any).payload as any[]).forEach((user: any) => {
                    switch (user.currentUser) {
                        case 'RIO':
                            user.image = 'https://ej2.syncfusion.com/demos/src/avatar/images/pic01.png';
                            break;
                        case 'JOHN':
                            user.image = 'https://ej2.syncfusion.com/demos/src/avatar/images/pic03.png';
                            break;
                        case 'MAXY':
                            user.image = 'https://ej2.syncfusion.com/demos/src/avatar/images/pic02.png';
                            break;
                        case 'SHAI':
                            user.image = "https://ej2.syncfusion.com/demos/src/avatar/images/pic04.png";
                            break;
                    }
                });
            }
            else {
                if ((data as any).payload.currentUser === 'RIO') {
                    (data as any).payload.image = "https://ej2.syncfusion.com/demos/src/avatar/images/pic01.png";
                } else if ((data as any).payload.currentUser === 'JOHN') {
                    (data as any).payload.image = "https://ej2.syncfusion.com/demos/src/avatar/images/pic03.png";
                }
                else if ((data as any).payload.currentUser === 'MAXY') {
                    (data as any).payload.image = "https://ej2.syncfusion.com/demos/src/avatar/images/pic02.png"
                }
                else if ((data as any).payload.currentUser === 'SHAI') {
                    (data as any).payload.image = "https://ej2.syncfusion.com/demos/src/avatar/images/pic04.png"
                }
            }
        }
        else if (action === 'connectionId') {
            let image = '';
            if (this.currentUser === 'RIO') {
                image = "https://ej2.syncfusion.com/demos/src/avatar/images/pic01.png";
            } else if (this.currentUser === 'JOHN') {
                image = "https://ej2.syncfusion.com/demos/src/avatar/images/pic03.png";
            }
            else if (this.currentUser === 'MAXY') {
                image = "https://ej2.syncfusion.com/demos/src/avatar/images/pic02.png"
            }
            else if (this.currentUser === 'SHAI') {
                image = "https://ej2.syncfusion.com/demos/src/avatar/images/pic04.png"
            }
            data.payload = { payload: data.payload, image: image }
        }
        this.collaborativeEditingHandler.applyRemoteAction(action, data.payload);
    }

    /**
     * Extracts or generates room ID from URL query parameters.
     * Ensures a unique room ID is set for the collaboration session.
     * 
     * @param fileName - Document file name (used for room naming)
     * @returns - Room identifier
     */
    private getRoomName(fileName?: string): string {
        // Check for browser environment
        if (typeof window !== 'undefined') {
            const queryString: string = window.location.search;
            const urlParams: URLSearchParams = new URLSearchParams(queryString);
            let roomId: string | null = urlParams.get('id');

            if (!roomId) {
                roomId = Math.random().toString(32).slice(2);
                window.history.replaceState({}, '', `?id=${roomId}`);
            }

            return roomId;
        }

        // Server-side environment or fallback
        return Math.random().toString(32).slice(2);
    }

    public updatePendingOperations(): any {
        // Apply initial state: annotations, form fields, page organizer snapshots
        // These are stored as snapshots, not incremental operations
        if (this.pendingOperations && this.pendingOperations.length > 0) {
            for (const op of this.pendingOperations) {
                this.collaborativeEditingHandler.applyRemoteAction(op.type, op);
            }
        }
    }
}
