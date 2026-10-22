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
        <button id="addDateField" (click)="addDateField()">Add Date Picker</button>
        <button id="addTimeField" (click)="addTimeField()">Add Time Picker</button>
      </div>
      <ejs-pdfviewer
        #pdfViewer
        id="container"
        [documentPath]="documentPath"
        [resourceUrl]="resourceUrl"
        style="height: 680px; display: block">
      </ejs-pdfviewer>
    </div>
  `
})
export class PDFViewerComponent {
  @ViewChild('pdfViewer') public pdfViewer: PdfViewerComponent | undefined;

  public documentPath: string = 'https://cdn.syncfusion.com/content/pdf/form-filling-document.pdf';
  public resourceUrl: string = 'https://cdn.syncfusion.com/ej2/31.2.2/dist/ej2-pdfviewer-lib';

  // Add a Date field
  addDateField(): void {
    const viewer = this.pdfViewer as any;
    viewer.formDesignerModule.addFormField('Textbox', {
      name: 'DateField1',
      bounds: { X: 146, Y: 200, Width: 200, Height: 24 },
      pageNumber: 1,
      isDateField: true,
      fontSize: 10,
      color: 'black',
      fontFamily: 'Helvetica',
      backgroundColor: '#daeaf7ff',
      borderColor: '#303030',
      alignment: 'Left',
      isReadOnly: false,
      visibility: 'visible',
      isRequired: false,
      isPrint: true,
      tooltip: '',
      thickness: 1,
      actions: {
        format: { script: 'AFDate_FormatEx("m/d/yy")' }
      }
    });
  }

  // Add a Time field
  addTimeField(): void {
    const viewer = this.pdfViewer as any;
    viewer.formDesignerModule.addFormField('Textbox', {
      name: 'TimeField1',
      bounds: { X: 146, Y: 250, Width: 200, Height: 24 },
      pageNumber: 1,
      isDateField: true,
      fontSize: 10,
      color: 'black',
      fontFamily: 'Helvetica',
      backgroundColor: '#daeaf7ff',
      borderColor: '#303030',
      alignment: 'Left',
      isReadOnly: false,
      visibility: 'visible',
      isRequired: false,
      isPrint: true,
      tooltip: '',
      thickness: 1,
      actions: {
        format: { script: 'AFTime_FormatEx("HH:MM")' }
      }
    });
  }
}