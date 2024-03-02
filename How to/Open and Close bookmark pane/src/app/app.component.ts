import { Component, OnInit } from '@angular/core';
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
  // specifies the template string for the PDF Viewer component
  template: `<div class="content-wrapper">
  <button (click)="openBookmark()">Open Thumbnail Pane</button>
  <button (click)="closeBookmark()">Close Bookmark Pane</button>
  <ejs-pdfviewer id="pdfViewer"
             [documentPath]='document'
                 [resourceUrl]='resource' 
             style="height:640px;display:block">
  </ejs-pdfviewer>
</div>`,
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
    PrintService]
})
export class AppComponent implements OnInit {
  public document = 'https://cdn.syncfusion.com/content/pdf/pdf-succinctly.pdf';
  public resource: string = 'https://cdn.syncfusion.com/ej2/24.1.41/dist/ej2-pdfviewer-lib';;
  ngOnInit(): void {
  }

  openBookmark() {
    var viewer = (<any>document.getElementById('pdfViewer')).ej2_instances[0];
    // Open Bookmark pane.
    viewer.bookmarkViewModule.openBookmarkPane();
  }

  closeBookmark() {
    var viewer = (<any>document.getElementById('pdfViewer')).ej2_instances[0];
    // Close Bookmark pane.
    viewer.bookmarkViewModule.closeBookmarkPane();
  }
}