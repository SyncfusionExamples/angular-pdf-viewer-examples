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
  <ejs-pdfviewer id="pdfViewer"
             [serviceUrl]='service'
             [documentPath]='document'
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
  public service = 'https://services.syncfusion.com/angular/production/api/pdfviewer';
  public document = 'https://cdn.syncfusion.com/content/pdf/pdf-succinctly.pdf';
  // To utilize the server-backed PDF Viewer, need to specify the service URL. This can be done by including the **[serviceUrl]='service'** attribute within the <ejs-pdfviewer></ejs-pdfviewer> component in app.component.html file.
  //public service: string = 'https://services.syncfusion.com/angular/production/api/pdfviewer';
  ngOnInit(): void {
  }
}