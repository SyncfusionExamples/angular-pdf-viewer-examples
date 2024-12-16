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
  PrintService
} from '@syncfusion/ej2-angular-pdfviewer';

@Component({
  selector: 'app-root',
  template: `
    <div class="content-wrapper">
      <div style="margin-top: 20px;">
        <button (click)="handleSearch()">Search PDF</button>
        <button (click)="handleSearchNext()">Search Next</button>
        <button (click)="handleCancelSearch()">Cancel Search</button>
      </div>
      <ejs-pdfviewer #pdfViewer
                     id="pdfViewer"
             [documentPath]='document'
                 [resourceUrl]='resource' 
             style="height:640px;display:block"
                     (textSearchHighlight)="handleTextSearchHighlight($event)">
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
  public resource: string = 'https://cdn.syncfusion.com/ej2/28.1.33/dist/ej2-pdfviewer-lib';
  pdfViewerComponent: any;
  
  ngOnInit(): void {
  }
  
  handleSearch() {
    var pdfviewer = (<any>document.getElementById("pdfViewer")).ej2_instances[0];
    pdfviewer.textSearchModule.searchText('PDF', false);
  }

  handleSearchNext() {
    var pdfviewer = (<any>document.getElementById("pdfViewer")).ej2_instances[0];
    pdfviewer.textSearchModule.searchNext();
}

  handleCancelSearch() {
    var pdfviewer = (<any>document.getElementById("pdfViewer")).ej2_instances[0];
    pdfviewer.textSearchModule.cancelTextSearch();
  }
  
  handleTextSearchHighlight(args: any) {
    var pdfviewer = (<any>document.getElementById("pdfViewer")).ej2_instances[0];
    console.log(args);
    const bounds = args.bounds;
    pdfviewer.annotationModule.addAnnotation('Rectangle', {
      pageNumber: args.pageNumber,
      offset: { x: bounds.left, y: bounds.top },
      width: bounds.width,
      height: bounds.height,
    });
  }
}