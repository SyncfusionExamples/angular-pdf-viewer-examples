import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonHeader, IonToolbar, IonTitle, IonSegment, IonSegmentButton, IonLabel, IonSpinner, IonText, IonAlert } from '@ionic/angular/standalone';
import { PdfViewerModule, LinkAnnotationService, BookmarkViewService, MagnificationService, ThumbnailViewService, ToolbarService, NavigationService, TextSearchService, TextSelectionService, PrintService, FormDesignerService, FormFieldsService, AnnotationService, PageOrganizerService } from '@syncfusion/ej2-angular-pdfviewer';
import { PdfService, PDFDocument } from '../../services/pdf.service';

@Component({
  selector: 'app-pdf-viewer',
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    IonSpinner,
    IonText,
    IonAlert,
    PdfViewerModule
  ],
  providers: [
    LinkAnnotationService,
    BookmarkViewService,
    MagnificationService,
    ThumbnailViewService,
    ToolbarService,
    NavigationService,
    TextSearchService,
    TextSelectionService,
    PrintService,
    FormDesignerService,
    FormFieldsService,
    AnnotationService,
    PageOrganizerService
  ],
  templateUrl: './pdf-viewer.component.html',
  styleUrls: ['./pdf-viewer.component.scss']
})
export class PdfViewerComponent implements OnInit {
  @ViewChild('pdfViewer') pdfViewer: any;

  pdfUrl = '';
  resourceUrlPath = '';
  documents: PDFDocument[] = [];
  currentDocument: PDFDocument | null = null;
  isLoading = false;
  errorMessage = '';
  showErrorAlert = false;

  alertButtons = [
    'OK',
    {
      text: 'Retry',
      handler: () => {
        this.reloadPdf();
        this.closeErrorAlert();
      }
    }
  ];

  constructor(private pdfService: PdfService) {
    // Set resource URL based on environment
    this.resourceUrlPath = this.getResourceUrl();
  }

  ngOnInit(): void {
    this.initializePdf();
  }

  /**
   * Initialize PDF viewer and load documents
   */
  private initializePdf(): void {
    // Subscribe to documents list
    this.pdfService.getDocuments().subscribe(docs => {
      this.documents = docs;
    });

    // Subscribe to selected document
    this.pdfService.selectedDocument$.subscribe(doc => {
      this.currentDocument = doc;
    });

    // Subscribe to PDF URL
    this.pdfService.pdfUrl$.subscribe(url => {
      this.pdfUrl = url;
    });

    // Subscribe to loading state
    this.pdfService.loading$.subscribe(loading => {
      this.isLoading = loading;
    });

    // Subscribe to error state
    this.pdfService.error$.subscribe(error => {
      this.errorMessage = error;
      this.showErrorAlert = !!error;
    });
  }

  /**
   * Handle document selection from segment
   */
  onDocumentChange(event: any): void {
    const documentId = event.detail.value;
    this.pdfService.selectDocumentById(documentId);
  }

  /**
   * Download current PDF
   */
  downloadPdf(): void {
    if (this.currentDocument) {
      const link = document.createElement('a');
      link.href = this.currentDocument.path;
      link.download = `${this.currentDocument.name}.pdf`;
      link.click();
    }
  }

  /**
   * Print current PDF
   */
  printPdf(): void {
    if (this.pdfViewer) {
      this.pdfViewer.print();
    } else {
      console.log('PDF Viewer not ready');
    }
  }

  /**
   * Close error alert
   */
  closeErrorAlert(): void {
    this.showErrorAlert = false;
    this.pdfService.clearError();
  }

  /**
   * Reload current PDF
   */
  reloadPdf(): void {
    if (this.currentDocument) {
      this.pdfService.selectDocument(this.currentDocument);
    }
  }

  /**
   * Get resource URL based on environment
   */
  private getResourceUrl(): string {
    // Use absolute path for resource URL
    const baseUrl = window.location.origin;
    return baseUrl + '/assets/ej2-pdfviewer-lib';
  }

  /**
   * Handle PDF document load success
   */
  onDocumentLoad(): void {
    console.log('PDF Document loaded successfully');
    this.isLoading = false;
  }

  /**
   * Handle PDF document load failure
   */
  onLoadFailed(event: any): void {
    console.error('PDF Document load failed:', event);
    this.errorMessage = 'Failed to load PDF document. Please check the file path.';
    this.showErrorAlert = true;
  }
}
