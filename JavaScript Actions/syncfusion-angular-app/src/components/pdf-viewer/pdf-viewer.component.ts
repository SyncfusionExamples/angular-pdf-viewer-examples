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
        <button (click)="addFormatFields()">Add Format Fields</button>
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
  @ViewChild('pdfViewer')
  public pdfViewer!: PdfViewerComponent;

  public documentPath =
    'https://cdn.syncfusion.com/content/pdf/pdf-succinctly.pdf';

  public resourceUrl =
    'https://cdn.syncfusion.com/ej2/31.2.2/dist/ej2-pdfviewer-lib';


  // Dynamically enable / disable Freehand Highlight support
  public addFormatFields(): void {
    const viewer = this.pdfViewer as any;

    const numberField = {
      name: 'NumberField',
      bounds: { X: 146, Y: 200, Width: 200, Height: 24 },
      pageNumber: 1,
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
      tooltip: 'Amount',
      thickness: 1,
      actions: {
        format: {
          script: 'AFNumber_Format(2, 0, 0, 0, "$", true)'
        }
      }
    };

    viewer.formDesignerModule.addFormField('Textbox', numberField);

    const percentField = {
      name: 'PercentField',
      bounds: { X: 146, Y: 300, Width: 200, Height: 24 },
      pageNumber: 1,
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
      tooltip: 'Percentage field',
      thickness: 1,
      actions: {
        format: {
          script: 'AFPercent_Format(2, 0)'
        }
      }
    };

    viewer.formDesignerModule.addFormField('Textbox', percentField);

    const specialField = {
      name: 'SpecialField',
      bounds: { X: 146, Y: 400, Width: 200, Height: 24 },
      pageNumber: 1,
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
      tooltip: 'Special format',
      thickness: 1,
      actions: {
        format: {
          script: 'AFSpecial_Format(0)'
        }
      }
    };

    viewer.formDesignerModule.addFormField('Textbox', specialField);

    const maskField = {
      name: 'MaskField',
      bounds: { X: 146, Y: 500, Width: 200, Height: 24 },
      pageNumber: 1,
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
      tooltip: 'Mask Field',
      thickness: 1,
      actions: {
        keyPressed: {
          script: 'AFSpecial_KeystrokeEx("AAA-9999")'
        }
      }
    };

    viewer.formDesignerModule.addFormField('Textbox', maskField);
  }
}