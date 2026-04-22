import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface PDFDocument {
  id: string;
  name: string;
  title: string;
  description: string;
  path: string;
  icon?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PdfService {
  // List of available PDF documents
  // Note: Replace with your actual PDFs in src/assets/pdfs/
  private documents: PDFDocument[] = [
    {
      id: 'sample-pdf',
      name: 'Sample PDF',
      title: 'Sample PDF Document',
      description: 'Add your PDF files to src/assets/pdfs/ and update this list',
      path: 'https://cdn.syncfusion.com/content/pdf/pdf-succinctly.pdf',
      icon: 'document'
    }
  ];

  // Current selected document
  private selectedDocumentSubject = new BehaviorSubject<PDFDocument | null>(null);
  public selectedDocument$ = this.selectedDocumentSubject.asObservable();

  // Current PDF URL
  private pdfUrlSubject = new BehaviorSubject<string>('');
  public pdfUrl$ = this.pdfUrlSubject.asObservable();

  // Loading state
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  // Error state
  private errorSubject = new BehaviorSubject<string>('');
  public error$ = this.errorSubject.asObservable();

  constructor() {
    // Initialize with first document
    if (this.documents.length > 0) {
      this.selectDocument(this.documents[0]);
    }
  }

  /**
   * Get all available PDF documents
   */
  getDocuments(): Observable<PDFDocument[]> {
    return new Observable(observer => {
      observer.next(this.documents);
      observer.complete();
    });
  }

  /**
   * Select a document and load its PDF
   */
  selectDocument(document: PDFDocument): void {
    this.loadingSubject.next(true);
    this.errorSubject.next('');
    this.selectedDocumentSubject.next(document);
    this.pdfUrlSubject.next(document.path);
    this.loadingSubject.next(false);
  }

  /**
   * Select document by ID
   */
  selectDocumentById(id: string): void {
    const document = this.documents.find(doc => doc.id === id);
    if (document) {
      this.selectDocument(document);
    } else {
      this.errorSubject.next(`Document with ID '${id}' not found`);
    }
  }

  /**
   * Get current selected document
   */
  getCurrentDocument(): PDFDocument | null {
    return this.selectedDocumentSubject.value;
  }

  /**
   * Get current PDF URL
   */
  getCurrentPdfUrl(): string {
    return this.pdfUrlSubject.value;
  }

  /**
   * Add a new document to the list
   */
  addDocument(document: PDFDocument): void {
    this.documents.push(document);
  }

  /**
   * Remove a document from the list
   */
  removeDocument(id: string): void {
    this.documents = this.documents.filter(doc => doc.id !== id);
  }

  /**
   * Handle PDF load error
   */
  handleError(error: string): void {
    this.errorSubject.next(error);
    console.error('PDF Error:', error);
  }

  /**
   * Clear error message
   */
  clearError(): void {
    this.errorSubject.next('');
  }
}
