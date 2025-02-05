import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  LinkAnnotationService,
  BookmarkViewService,
  MagnificationService,
  ThumbnailViewService,
  ToolbarService,
  NavigationService,
  AnnotationService,
  TextSearchService,
  TextSelectionService,
  FormFieldsService,
  FormDesignerService,
  PrintService
} from '@syncfusion/ej2-angular-pdfviewer';

@Component({
  selector: 'app-root',
  template: `
    <div class="content-wrapper">
      <button (click)="performOCR()">Perform OCR</button>
      <ejs-pdfviewer 
        id="pdfViewer"
        [resourceUrl]="resource"
        [documentPath]="document"
        style="height: 640px; display: block;">
      </ejs-pdfviewer>
    </div>
  `,
  providers: [
    LinkAnnotationService,
    BookmarkViewService,
    MagnificationService,
    ThumbnailViewService,
    ToolbarService,
    NavigationService,
    AnnotationService,
    TextSearchService,
    TextSelectionService,
    FormFieldsService,
    FormDesignerService,
    PrintService
  ]
})
export class AppComponent implements OnInit {
  public document: string = 'https://cdn.syncfusion.com/content/pdf/pdf-succinctly.pdf'; // Initial PDF file URL
  public resource: string = "https://cdn.syncfusion.com/ej2/26.2.11/dist/ej2-pdfviewer-lib"; // Syncfusion library URL

  constructor(private http: HttpClient) {}

  ngOnInit(): void {}

  performOCR() {
    // Fetch the PDF file as a Blob
    this.http.get(this.document, { responseType: 'blob' }).subscribe((pdfBlob) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        let base64PDF = reader.result as string;

        // Remove the prefix if it exists (e.g., data:application/pdf;base64,)
        if (base64PDF.startsWith('data:application/pdf;base64,')) {
          base64PDF = base64PDF.substring('data:application/pdf;base64,'.length);
        }

        // Construct the body to match the Dictionary<string, string> on the server
        const body = {
          documentBase64: base64PDF
        };

        // Send the Base64 PDF to the server to perform OCR
        this.http.post('https://localhost:44309/pdfviewer/PerformOCR', body, { responseType: 'text' })
          .subscribe({
            next: (response: string) => {
              // Handle the server response (processed PDF in Base64 format)
              this.document = response;
            },
            error: (err: any) => {
              // Handle any errors
              console.error('OCR processing failed', err);
            },
            complete: () => {
              console.log('OCR processing complete');
            }
          });
      };

      // Read the PDF Blob as a Base64 string
      reader.readAsDataURL(pdfBlob);
    });
  }
}
