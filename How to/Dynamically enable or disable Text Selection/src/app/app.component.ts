import { Component, OnInit, ViewChild } from '@angular/core';
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
  PrintService,
  PdfViewerComponent
} from '@syncfusion/ej2-angular-pdfviewer';

@Component({
  selector: 'app-root',
  template: `
    <div class="content-wrapper">
      <div class="button-container" style="margin-bottom: 10px;">
        <button (click)="enableTextSelection()" style="margin-right: 10px;">Enable Text Selection</button>
        <button (click)="disableTextSelection()">Disable Text Selection</button>
      </div>
      <ejs-pdfviewer 
        #pdfViewer
        id="pdfViewer"
        [resourceUrl]="resourceUrl"
        [documentPath]="document"
        [enableTextSelection]="false"
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
  public document: string = 'https://cdn.syncfusion.com/content/pdf/pdf-succinctly.pdf';
  public resourceUrl: string = 'https://cdn.syncfusion.com/ej2/28.1.33/dist/ej2-pdfviewer-lib';
  public isTextSelectionEnabled: boolean = true;
  
  @ViewChild('pdfViewer')
  public pdfViewerObj!: PdfViewerComponent;

  ngOnInit(): void { }

  enableTextSelection(): void {
    if (this.pdfViewerObj) {
      this.pdfViewerObj.enableTextSelection = true;
    }
  }

  disableTextSelection(): void {
    if (this.pdfViewerObj) {
      this.pdfViewerObj.enableTextSelection = false;
    }
  }
}