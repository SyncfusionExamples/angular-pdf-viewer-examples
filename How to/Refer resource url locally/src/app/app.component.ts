import { Component, OnInit } from '@angular/core';
import { LinkAnnotationService, BookmarkViewService, MagnificationService,
         ThumbnailViewService, ToolbarService, NavigationService,
         AnnotationService, TextSearchService, TextSelectionService,
         PrintService,FormDesignerService, PageOrganizerService
       } from '@syncfusion/ej2-angular-pdfviewer';

@Component({
  selector: 'app-root',
  // specifies the template string for the PDF Viewer component
  template: `<div class="content-wrapper">
                <ejs-pdfviewer id="pdfViewer"
                       [documentPath]='document'
                       [resourceUrl]='resource'
                       style="height:640px;display:block">
                </ejs-pdfviewer>
             </div>`,
  providers: [ LinkAnnotationService, BookmarkViewService, MagnificationService,
               ThumbnailViewService, ToolbarService, NavigationService,
               AnnotationService, TextSearchService, TextSelectionService,
               PrintService,FormDesignerService, PageOrganizerService ]
})
export class AppComponent implements OnInit {
  public document: string = window.location.origin + "/assets/pdfsuccinctly.pdf";
  public resource: string = window.location.origin + "/assets/ej2-pdfviewer-lib";
  ngOnInit(): void {
  }
}