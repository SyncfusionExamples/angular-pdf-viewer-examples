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
  <button (click)="FindTextBounds()" style=margin-top:60px>FindTextBounds</button>
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
  public resource: string = 'https://cdn.syncfusion.com/ej2/27.1.48/dist/ej2-pdfviewer-lib';;
  ngOnInit(): void {
  }

  FindTextBounds() {
    var viewer = (<any>document.getElementById('pdfViewer')).ej2_instances[0];
    // Find and get the bounds of a text
    console.log(viewer.textSearch.findText('adobe', false));
    // Find and get the bounds of a text on the desired page
    console.log(viewer.textSearch.findText('adobe', false, 7));
    // Find and get the bounds of the list of text
    console.log(viewer.textSearch.findText(['adobe', 'pdf'], false));
    // Find and get the bounds of the list of text on desired page
    console.log(viewer.textSearch.findText(['adobe', 'pdf'], false, 7));
  }
}