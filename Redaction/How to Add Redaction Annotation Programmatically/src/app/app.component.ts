import { Component, ViewChild, AfterViewInit } from '@angular/core';
import {
  PdfViewerComponent,
  AnnotationService,
  ToolbarService,
  LinkAnnotationService,
  BookmarkViewService,
  MagnificationService,
  ThumbnailViewService,
  NavigationService,
  TextSearchService,
  TextSelectionService,
  PrintService,
  FormFieldsService,
  FormDesignerService,
  PageOrganizerService,
  ToolbarSettingsModel
} from '@syncfusion/ej2-angular-pdfviewer';

@Component({
  selector: 'app-root',
  template: `
    <div style="margin-bottom:8px; display:flex; gap:8px; align-items:center;">
    <button id="addRedactAnnot" type="button" (click)="addRedaction()">Add Redaction Annotation</button>
    <button id="addPageRedactions" type="button" (click)="addPageRedactions()">Add Page Redaction</button>
    <button id="redact" type="button" (click)="applyRedaction()">Apply Redaction</button>
    <button (click)="deleteAnnotationById()">Delete Annotation By Id</button>
    <button id="editRedactAnnotation" (click)="editRedactAnnotation()">Edit Redact Annotation</button>
    </div>
    <ejs-pdfviewer
      #pdfviewer
      id="PdfViewer"
      [documentPath]="document"
      [resourceUrl]="resource"
      style="height:640px; display:block">
    </ejs-pdfviewer>
  `,
  providers: [
    AnnotationService,
    ToolbarService,
    LinkAnnotationService,
    BookmarkViewService,
    MagnificationService,
    ThumbnailViewService,
    NavigationService,
    TextSearchService,
    TextSelectionService,
    PrintService,
    FormFieldsService,
    FormDesignerService,
    PageOrganizerService
  ]
})
export class AppComponent implements AfterViewInit {
  @ViewChild('pdfviewer', { static: true }) pdfViewer!: PdfViewerComponent;

  public document = 'https://cdn.syncfusion.com/content/pdf/pdf-succinctly.pdf';
  public resource = 'https://cdn.syncfusion.com/ej2/31.2.2/dist/ej2-pdfviewer-lib';

  // Keep toolbar simple; include redaction edit tool if you want UI access too
  public toolbarSettings: ToolbarSettingsModel = {
    toolbarItems: [
      'OpenOption',
      'PageNavigationTool',
      'MagnificationTool',
      'PanTool',
      'SelectionTool',
      'AnnotationEditTool',
      'RedactionEditTool',   // shows the redaction UI tool (optional)
      'SearchOption',
      'PrintOption',
      'DownloadOption'
    ]
  };

  // Configure default redaction annotation properties (same as your JS)
  ngAfterViewInit(): void {
    (this.pdfViewer as any).redactionSettings = {
      overlayText: 'Confidential',
      markerFillColor: '#FF0000',
      markerBorderColor: '#000000',
      isRepeat: false,
      fillColor: '#F8F8F8',
      fontColor: '#333333',
      fontSize: 14,
      fontFamily: 'Symbol',
      textAlign: 'Right'
    };
  }

  addRedaction(): void {
    if (!this.pdfViewer) { return; }

    this.pdfViewer.annotation.addAnnotation('Redaction', {
      bound: { x: 200, y: 480, width: 150, height: 75 },
      pageNumber: 1,
      markerFillColor: '#0000FF',
      markerBorderColor: 'white',
      fillColor: 'red',
      overlayText: 'Confidential',
      fontColor: 'yellow',
      fontFamily: 'Times New Roman',
      fontSize: 8,
      beforeRedactionsApplied: false
    } as any);
  }

  //Delete Redaction Annotation
  deleteAnnotationById(): void {
    this.pdfViewer.annotationModule.deleteAnnotationById(
      (this.pdfViewer as any).annotationCollection[0].annotationId
    );
  }
  //You can listen to the annotationAdd event to track when annotations are added.
  onAnnotationAdd(args: any): void {
    console.log('Annotation added:', args);
  }

  //Edit RedactionAnnotation
  editRedactAnnotation(): void {
    const collection: any[] = (this.pdfViewer as any).annotationCollection;
    for (let i = 0; i < collection.length; i++) {
      if (collection[i].subject === 'Redaction') {
        collection[i].overlayText = 'EditedAnnotation';
        collection[i].markerFillColor = '#22FF00';
        collection[i].markerBorderColor = '#000000';
        collection[i].isRepeat = true;
        collection[i].fillColor = '#F8F8F8';
        collection[i].fontColor = '#333333';
        collection[i].fontSize = 14;
        collection[i].fontFamily = 'Symbol';
        collection[i].textAlign = 'Right';
        collection[i].beforeRedactionsApplied = false;

        (this.pdfViewer as any).annotation.editAnnotation(collection[i]);
      }
    }
  }

  // Add page redactions programmatically (pages 1, 3, 5, 7)
  addPageRedactions(): void {
    this.pdfViewer.annotation.addPageRedactions([1, 3, 5, 7]);
  }

  // Apply redaction programmatically (irreversible)
  applyRedaction(): void {
    this.pdfViewer.annotation.redact();
  }
}
