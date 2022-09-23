
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
  PrintService
} from '@syncfusion/ej2-angular-pdfviewer';

@Component({
  selector: 'app-root',
  // specifies the template string for the PDF Viewer component
  template: `<div class="content-wrapper">
  <ejs-pdfviewer id="pdfViewer" [serviceUrl]='service' [enableAnnotation]='false' [enableFormFields]='false' [documentPath]='document' style="height:640px;display:block"></ejs-pdfviewer>
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
    PrintService
  ]
})
export class AppComponent implements OnInit {
public service = 'https://ej2services.syncfusion.com/production/web-services/api/pdfviewer';
public document = 'FormFillingDocument.pdf';
ngOnInit(): void {
}
}
