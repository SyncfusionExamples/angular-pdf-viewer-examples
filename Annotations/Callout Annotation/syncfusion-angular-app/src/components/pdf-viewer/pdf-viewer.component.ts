import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';

import {
  PdfViewerModule,
  LinkAnnotationService,
  BookmarkViewService,
  MagnificationService,
  ThumbnailViewService,
  ToolbarService,
  NavigationService,
  TextSearchService,
  TextSelectionService,
  PrintService,
  AnnotationService,
  FormFieldsService,
  FormDesignerService,
  PageOrganizerService,
  PdfViewerComponent
} from '@syncfusion/ej2-angular-pdfviewer';

@Component({
  selector: 'app-pdf-viewer',
  standalone: true,
  imports: [CommonModule, PdfViewerModule],
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
    AnnotationService,
    FormFieldsService,
    FormDesignerService,
    PageOrganizerService
  ],
  template: `
    <div class="pdf-viewer-container" style="margin: 50px 90px">
      <div class="control-section" style="margin-bottom: 8px">
        <button id="enableCalloutMode" (click)="enableCalloutMode()">Enable Callout Mode</button>
        <button id="exitCalloutMode" (click)="exitCalloutMode()">Exit Callout Mode</button>
        <button id="addCalloutProgrammatically" (click)="addCalloutProgrammatically()">Add Callout Programmatically</button>
        <button id="editCalloutProgrammatically" (click)="editCalloutProgrammatically()">Edit Callout Programmatically</button>
      </div>
      <ejs-pdfviewer
        #pdfViewer
        id="container"
        [documentPath]="documentPath"
        [resourceUrl]="resourceUrl"
        style="height: 640px; display: block">
      </ejs-pdfviewer>
    </div>
  `
})
export class PDFViewerComponent {
  @ViewChild('pdfViewer') public pdfViewer: PdfViewerComponent | undefined;

  public documentPath: string = 'https://cdn.syncfusion.com/content/pdf/pdf-succinctly.pdf';
  public resourceUrl: string = 'https://cdn.syncfusion.com/ej2/31.2.2/dist/ej2-pdfviewer-lib';

  // Enable Callout Annotation mode
  enableCalloutMode(): void {
    const viewer = this.pdfViewer as any;
    viewer.annotation.setAnnotationMode('Callout');
  }

  // Exit Callout Annotation mode
  exitCalloutMode(): void {
    const viewer = this.pdfViewer as any;
    viewer.annotation.setAnnotationMode('None');
  }

  // Add Callout Annotation programmatically
  addCalloutProgrammatically(): void {
    const viewer = this.pdfViewer as any;
    viewer.annotation.addAnnotation('Callout', {
      offset: { x: 200, y: 200 },
      pageNumber: 1,
      opacity: 1,
      borderColor: '#000000',
      borderWidth: 1,
      borderStyle: 'solid',
      author: 'Guest',
      calloutLines: [
        { x: 50, y: 50 },
        { x: 100, y: 100 },
        { x: 200, y: 250 }
      ],
      lineEndingStyle: 'Open'
    } as any);
  }

  // Edit Callout Annotation programmatically
  editCalloutProgrammatically(): void {
    const viewer = this.pdfViewer as any;
    if (viewer.annotationCollection) {
      for (let i = 0; i < viewer.annotationCollection.length; i++) {
        const annotation = viewer.annotationCollection[i];
        if (annotation.subject == 'Callout') {
          annotation.bounds = { x: 300, y: 300, width: 200, height: 40, top: 300, left: 300 };
          annotation.dynamicText = 'Callout edited';
          annotation.author = 'Syncfusion';
          annotation.strokeColor = 'red';
          annotation.fillColor = 'yellow';
          annotation.textAlign = 'Center';
          viewer.annotation.editAnnotation(annotation);
          break;
        }
      }
    }
  }
}
