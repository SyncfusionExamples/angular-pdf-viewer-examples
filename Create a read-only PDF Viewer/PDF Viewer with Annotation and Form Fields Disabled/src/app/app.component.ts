
import { Component, OnInit } from '@angular/core';
import {
  PdfViewerComponent,
  LinkAnnotationService, 
  BookmarkViewService,
  MagnificationService, 
  ThumbnailViewService,
  ToolbarService, 
  NavigationService, 
  TextSearchService, 
  TextSelectionService, 
  PrintService,
  FormFieldsService,
  FormDesignerService
} from '@syncfusion/ej2-angular-pdfviewer';

@Component({
  selector: 'app-root',
  // specifies the template string for the PDF Viewer component
  template: `<div class="content-wrapper">
  <ejs-pdfviewer id="pdfViewer" [enableAnnotation]='false' [enableFormFields]='false' [documentPath]='document' style="height:640px;display:block"></ejs-pdfviewer>
</div>`,
  providers: [
    PdfViewerComponent,
    LinkAnnotationService, 
    BookmarkViewService,
    MagnificationService,
    ThumbnailViewService, 
    ToolbarService, 
    NavigationService, 
    TextSearchService, 
    TextSelectionService, 
    PrintService,
    FormFieldsService,
    FormDesignerService
  ]
})
export class AppComponent implements OnInit {

// To utilize the server-backed PDF Viewer, need to specify the service URL. Within the template, configure the PDF Viewer by adding the **[serviceUrl]='service'** attribute inside the div element.
//public service = 'https://services.syncfusion.com/angular/production/api/pdfviewer';

public document = "https://cdn.syncfusion.com/content/pdf/form-filling-document.pdf";

  ngOnInit(): void {
  }
}
