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
  PrintService,
  PageOrganizerService
} from '@syncfusion/ej2-angular-pdfviewer';
import  {Browser} from '@syncfusion/ej2-base';

@Component({
  selector: 'app-root',
  // specifies the template string for the PDF Viewer component
  template: `<div class="content-wrapper">
  <ejs-pdfviewer id="pdfViewer"
             [documentPath]='document'
             [resourceUrl]='resource' 
             [documentLoad]="documentLoaded"
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
    PrintService,
    PageOrganizerService]
})
export class AppComponent implements OnInit {
  public document = 'https://cdn.syncfusion.com/content/pdf/pdf-succinctly.pdf';
  public resource: string = 'https://cdn.syncfusion.com/ej2/24.1.41/dist/ej2-pdfviewer-lib';;
  ngOnInit(): void {
  }

  public documentLoaded(args: any): void {
    var viewer = (<any>document.getElementById('pdfViewer')).ej2_instances[0];
      if (Browser.isDevice && !viewer.enableDesktopMode) {
        viewer.maxZoom = 200;
          viewer.minZoom = 10;
      }
      else {
        viewer.zoomMode = 'Default';
      }
  }
}