import { Component, ViewChild, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PdfViewerModule, PdfViewerComponent } from '@syncfusion/ej2-angular-pdfviewer';
import {
  LinkAnnotationService, BookmarkViewService, MagnificationService,
  ThumbnailViewService, ToolbarService, NavigationService,
  TextSearchService, TextSelectionService, PrintService,
  FormDesignerService, FormFieldsService, AnnotationService,
  PageOrganizerService
} from '@syncfusion/ej2-angular-pdfviewer';
import { PdfViewerAdapter } from './pdfViewerAdapter';
import { CollaborationClient } from '@syncfusion/ej2-collaborator';

// ============================================================
// Collaboration Configuration
// ============================================================

const userList = ['RIO', 'JOHN', 'MAXY', 'SHAI', 'SRI'];
const currentUserName = userList[Math.floor(Math.random() * userList.length)];
const SERVICE_URL = 'http://localhost:8081/';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, PdfViewerModule],
  providers: [
    LinkAnnotationService, BookmarkViewService, MagnificationService,
    ThumbnailViewService, ToolbarService, NavigationService,
    TextSearchService, TextSelectionService, PrintService,
    FormDesignerService, FormFieldsService, AnnotationService,
    PageOrganizerService
  ],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App implements OnInit, OnDestroy {
  @ViewChild('pdfViewer') pdfViewerComponent!: PdfViewerComponent;

  // ============================================================
  // Properties
  // ============================================================

  isDocumentLoaded = false;
  collaborationStatus = 'initializing';
  currentUser = currentUserName;
  connectedUsers: string[] = [];
  roomName = '';

  // Persistent references for collaboration
  adapterRef: PdfViewerAdapter | null = null;
  clientRef: CollaborationClient | null = null;
  roomNameRef = '';

  resourceUrl = 'https://cdn.syncfusion.com/ej2/34.1.29/dist/ej2-pdfviewer-lib';

  // ============================================================
  // Lifecycle Hooks
  // ============================================================

  ngOnInit() {
    console.log('[App] Component initialized');
  }

  ngOnDestroy() {
    // Cleanup collaboration resources on unmount
    if (this.clientRef) {
      console.log('[App] Cleaning up collaboration client');
    }
  }

  // ============================================================
  // Helper Functions - PDF Fetch and Load
  // ============================================================

  /**
   * Loads a PDF blob into the viewer
   */
  async loadPDFBlobIntoViewer(pdfBlob: Blob): Promise<void> {
    try {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => {
          try {
            const arrayBuffer = reader.result as ArrayBuffer;
            const uint8Array = new Uint8Array(arrayBuffer);

            // Attempt to load using viewer.load() with Uint8Array
            if (this.pdfViewerComponent && typeof (this.pdfViewerComponent as any).load === 'function') {
              (this.pdfViewerComponent as any).load(uint8Array, '');
              console.log('[App] Loaded PDF using viewer.load(Uint8Array)');
              resolve();
              return;
            }

            // Fallback: Try loading via data URL
            const dataReader = new FileReader();
            dataReader.onload = () => {
              try {
                const dataUrl = dataReader.result as string;

                if (this.pdfViewerComponent && typeof (this.pdfViewerComponent as any).load === 'function') {
                  (this.pdfViewerComponent as any).load(dataUrl, '');
                  console.log('[App] Loaded PDF using viewer.load(dataUrl)');
                  resolve();
                } else {
                  console.error('[App] Viewer does not support load method');
                  reject(new Error('Viewer load method not available'));
                }
              } catch (error) {
                reject(error);
              }
            };

            dataReader.onerror = () => {
              reject(new Error('Failed to read blob as data URL'));
            };

            dataReader.readAsDataURL(pdfBlob);

          } catch (error) {
            reject(error);
          }
        };

        reader.onerror = () => {
          reject(new Error('Failed to read blob as array buffer'));
        };

        reader.readAsArrayBuffer(pdfBlob);
      });

    } catch (error) {
      console.error('[App] Error loading PDF blob:', error);
      throw error;
    }
  }

  /**
   * Fetches the current collaborative document from the server and loads it into the viewer
   */
  async fetchAndLoadPDFDocument(): Promise<void> {
    try {
      console.log(`[App] Fetching PDF from room: ${this.roomNameRef}`);

      const queryParams = new URLSearchParams({
        roomName: this.roomNameRef || 'default'
      });

      const response = await fetch(
        `${SERVICE_URL}api/CollaborativeEditing/GetPDFDocument?${queryParams.toString()}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(`Server error: ${result.error}`);
      }

      console.log(`[App] PDF retrieved successfully - Size: ${result.contentLength} bytes`);

      // Decode Base64 content to binary string
      const binaryString = atob(result.content);

      // Convert binary string to Uint8Array
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Create Blob from Uint8Array
      const pdfBlob = new Blob([bytes], { type: 'application/pdf' });
      console.log(`[App] Converted to Blob - Size: ${pdfBlob.size} bytes`);

      // Load the PDF into the viewer
      await this.loadPDFBlobIntoViewer(pdfBlob);
      console.log('[App] PDF loaded into viewer');

    } catch (error) {
      console.error('[App] Error fetching PDF document:', error);
      throw error;
    }
  }

  // ============================================================
  // Event Handlers - Collaboration Lifecycle
  // ============================================================

  /**
   * Handler for viewer.resourcesLoaded event
   */
  async onResourcesLoaded(): Promise<void> {
    console.log('[App] Viewer resourcesLoaded event triggered');

    if (!this.isDocumentLoaded) {
      try {
        console.log(`[App] Initializing collaboration - User: ${this.currentUser}, Service: ${SERVICE_URL}`);

        this.collaborationStatus = 'loading';
        this.isDocumentLoaded = true;

        // Initialize collaboration asynchronously
        this.initializeCollaboration();

      } catch (error) {
        console.error('[App] Error initializing collaboration:', error);
        this.collaborationStatus = 'error';
      }
    }
  }

  /**
   * Initialize collaboration
   */
  private async initializeCollaboration(): Promise<void> {
    try {
      // Step 1: Initialize PdfViewerAdapter
      this.adapterRef = new PdfViewerAdapter(this.pdfViewerComponent, SERVICE_URL, this.currentUser);
      console.log('[App] PdfViewerAdapter initialized');

      // Step 2: Create and configure CollaborationClient
      this.clientRef = new CollaborationClient(this.adapterRef, {
        serviceUrl: SERVICE_URL,
        connectionType: 'websocket',
        currentUser: this.currentUser,
        onUserJoined: (user: any) => {
          console.log('[App] User joined collaboration:', user);
          const userName = user.userName || user.currentUser;
          if (!this.connectedUsers.includes(userName)) {
            this.connectedUsers = [...this.connectedUsers, userName];
          }
        },
        onUserLeft: (user: any) => {
          console.log('[App] User left collaboration:', user);
          const userName = user.userName || user.currentUser;
          this.connectedUsers = this.connectedUsers.filter(u => u !== userName);
        }
      });

      console.log('[App] CollaborationClient initialized');

      // Step 3: Load from server (gets room name and pending operations)
      const roomName = await this.adapterRef.loadFromServer();
      this.roomNameRef = roomName;
      this.roomName = roomName;
      console.log(`[App] Loaded from server - Room: ${roomName}`);

      // Step 4: Join the collaboration room with the client
      await this.clientRef.joinRoomAsync(roomName);
      console.log(`[App] Joined collaboration room: ${roomName}`);

      // Step 5: Fetch and load the current PDF document state
      await this.fetchAndLoadPDFDocument();
      console.log('[App] PDF document loaded successfully');

      this.collaborationStatus = 'connected';
      this.connectedUsers = [this.currentUser];

    } catch (error) {
      console.error('[App] Error during collaboration initialization:', error);
      this.collaborationStatus = 'error';
      console.log('[App] Falling back to default document');
    }
  }

  /**
   * Handler for viewer.documentChanged event
   */
  onDocumentChanged(args: any): void {
    try {
      // Handle AnnotationChangedEventArgs
      if (args && 'annotationId' in args) {
        console.log('[App] Annotation changed:', args.annotationId);

        let operations: any[] = [];
        if (args.action) {
          operations = [{
            action: args.action,
            annotation: args.annotationId,
            type: 'annotation',
            isRedacted: args.isRedacted
          }];
        } else {
          operations = [{
            type: 'removeUser',
            currentUser: this.currentUser
          }];
        }

        console.log('[App] Annotation operation:', operations);
        if (this.adapterRef && typeof (this.adapterRef as any).sendActionToServer === 'function') {
          (this.adapterRef as any).sendActionToServer(operations).catch((err: any) =>
            console.error('[App] Error sending annotation operation:', err)
          );
        }
      }
      // Handle FormFieldChangedEventArgs
      else if (args && 'formField' in args && !('fieldName' in args)) {
        console.log('[App] Form field changed:', args.formField);

        const operations = [{
          action: args.action,
          formField: args.formField,
          type: 'formField'
        }];

        console.log('[App] Form field operation:', operations);
        if (this.adapterRef && typeof (this.adapterRef as any).sendActionToServer === 'function') {
          (this.adapterRef as any).sendActionToServer(operations).catch((err: any) =>
            console.error('[App] Error sending form field operation:', err)
          );
        }
      }
      // Handle FormFieldFocusOutEventArgs (form field value updates)
      else if (args && 'fieldName' in args) {
        console.log('[App] Form field updated:', args.fieldName);

        const operations = [{
          action: 'formFieldUpdate',
          data: args,
          type: 'formField'
        }];

        console.log('[App] Form field update operation:', operations);
        if (this.adapterRef && typeof (this.adapterRef as any).sendActionToServer === 'function') {
          (this.adapterRef as any).sendActionToServer(operations).catch((err: any) =>
            console.error('[App] Error sending form field update:', err)
          );
        }
      }
      // Handle PageOrganizerSavedEventArgs
      else if (args && 'organizePageActions' in args) {
        console.log('[App] Page organizer changed');

        const eventData = args;
        const actionDetails = args.organizePageActions && typeof args.organizePageActions === 'string'
          ? JSON.parse(args.organizePageActions)
          : "";

        let operations: any[] = [];

        if (eventData && eventData.savedDocument === null && actionDetails.action && actionDetails.action === 'applyCancelled') {
          operations = [{
            type: 'removeUser',
            currentUser: this.currentUser
          }];
          console.log('[App] Page organizer operation cancelled');
        }
        else if (eventData && eventData.savedDocument !== null && actionDetails.length > 0 && actionDetails[0].action !== 'applyCancelled') {
          operations = [{
            action: 'pageOrganizerUpdate',
            data: args.organizePageActions,
            type: 'pageOrganizer'
          }];
          console.log('[App] Page organizer operation:', operations);
        } else {
          console.log('[App] No valid page organizer operation to send');
          return;
        }

        if (this.adapterRef && typeof (this.adapterRef as any).sendActionToServer === 'function') {
          (this.adapterRef as any).sendActionToServer(operations).catch((err: any) =>
            console.error('[App] Error sending page organizer operation:', err)
          );
        }
      }

    } catch (error) {
      console.error('[App] Error processing document change:', error);
    }
  }
}
