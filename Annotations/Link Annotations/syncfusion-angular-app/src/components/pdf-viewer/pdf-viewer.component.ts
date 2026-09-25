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
      <button id="addInternalLink" (click)="addInternalLink()">Add Internal Link</button>
      <button id="addExternalLink" (click)="addExternalLink()">Add External Link</button>
      <button id="editLinkAnnotation" (click)="editLinkAnnotation()">Edit Link Annotation</button>
      <ejs-pdfviewer
        #pdfViewer
        id="container"
        [documentPath]="documentPath"
        [resourceUrl]="resourceUrl"
        hyperlinkOpenState="NewTab"
        style="height: 640px; display: block">
      </ejs-pdfviewer>
    </div>
  `
})
export class PDFViewerComponent {
   @ViewChild('pdfViewer') public pdfViewer: PdfViewerComponent | undefined;

  public documentPath: string = 'https://cdn.syncfusion.com/content/pdf/pdf-succinctly.pdf';

  public resourceUrl: string = 'https://cdn.syncfusion.com/ej2/23.2.6/dist/ej2-pdfviewer-lib';


addInternalLink(): void {
  const pdfViewer = this.pdfViewer as any;

  this.pdfViewer?.annotation.addAnnotation('Link', {
    offset: { x: 200, y: 480 },
    pageNumber: 1,
    width: 150,
    height: 75,
    destinationPageIndex: 4,
    destinationLocation: { x: 100, y: 200 },
    zoomValue: 4,
    strokeColor: '#1433e3'
  }as any);
}

addExternalLink(): void {
  const pdfViewer = this.pdfViewer as any;

  pdfViewer.annotation.addAnnotation('Link', {
    offset: { x: 450, y: 480 },
    pageNumber: 1,
    width: 150,
    height: 75,
    url: 'https://www.syncfusion.com',
    strokeColor: '#FF0000'
  }as any);
}

editLinkAnnotation(): void {
  const pdfViewer = this.pdfViewer as any;

  for (const linkAnnotation of pdfViewer.annotationCollection) {
    if (linkAnnotation.subject === 'Link') {
      linkAnnotation.strokeColor = '#1fcbd4';
      linkAnnotation.thickness = 2;
      linkAnnotation.bounds = { left: 100, top: 100, width: 100, height: 100 };
      linkAnnotation.url = 'https://www.google.com';
      linkAnnotation.destinationPageIndex = 3;
      linkAnnotation.destinationLocation = { x: 300, y: 300 };
      linkAnnotation.zoomValue = 1;
      pdfViewer.annotation.editAnnotation(linkAnnotation);
      break;
    }
  }
}
}