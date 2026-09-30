import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';

import {
  PdfViewerModule,
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
      <button id="AddTextStamp" (click)="addTextStamp()">Add Text Stamp</button>
      <button id="AddImageStamp" (click)="addImageStamp()">Add Image Stamp</button>
      <ejs-pdfviewer
        #pdfViewer
        id="container"
        [documentPath]="documentPath"
        [resourceUrl]="resourceUrl"
        [customStampSettings]="customStampSettings"
        style="height: 640px; display: block">
      </ejs-pdfviewer>
    </div>
  `
})
export class PDFViewerComponent {
   @ViewChild('pdfViewer') public pdfViewer: PdfViewerComponent | undefined;

  public documentPath: string = 'https://cdn.syncfusion.com/content/pdf/pdf-succinctly.pdf';

  public resourceUrl: string = 'https://cdn.syncfusion.com/ej2/35.1.37/dist/ej2-pdfviewer-lib';

  public customStampSettings = {
    fontFamilyCollection: ['Arial', 'Times New Roman', 'Courier New'],
    customTextStamps: [{
      title: 'Draft',
      subtitle: '[$author] DD/MMMM/YYYY, h:mm A',
      bold: true,
      textColor: '#000000',
      backgroundColor: '#1693f8',
      fontFamily: 'Arial'
    }]
  };

  addTextStamp(): void {
    this.pdfViewer?.annotation.addAnnotation('Stamp', {
      offset: { x: 100, y: 200 },
      pageNumber: 1,
      customTextStamps: [{
        title: 'Draft',
        subtitle: '[$author] DD/MMMM/YYYY, h:mm A',
        bold: true,
        textColor: '#000000',
        backgroundColor: '#1693f8',
        underline: true,
        fontFamily: 'Arial',
        strikeout: true
      }]
    } as any);
  }

  addImageStamp(): void {
    this.pdfViewer?.annotation.addAnnotation('Stamp', {
      offset: { x: 100, y: 300 },
      pageNumber: 1,
      width: 160,
      height: 80,
      customStamps: [{
        customStampName: 'Image',
        customStampImageSource: 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22320%22 height=%22160%22 viewBox=%220 0 320 160%22%3E%3Crect x=%228%22 y=%228%22 width=%22304%22 height=%22144%22 rx=%2210%22 fill=%22white%22 stroke=%22%231e6b45%22 stroke-width=%2212%22/%3E%3Ctext x=%22160%22 y=%22100%22 text-anchor=%22middle%22 font-family=%22Arial,sans-serif%22 font-size=%2242%22 font-weight=%22700%22 fill=%22%231e6b45%22%3EAPPROVED%3C/text%3E%3C/svg%3E'
      }]
    } as any);
  }
}