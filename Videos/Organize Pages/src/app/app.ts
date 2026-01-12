import { Component, } from '@angular/core';
import {
   LinkAnnotationService, BookmarkViewService, MagnificationService,
   ThumbnailViewService, ToolbarService, NavigationService,
   TextSearchService, AnnotationService, TextSelectionService,
   FormFieldsService, FormDesignerService, PageOrganizerService, PrintService,
   PdfViewerModule
} from '@syncfusion/ej2-angular-pdfviewer';

@Component({
   selector: 'app-root',
   imports: [PdfViewerModule],
   template: `<div class="content-wrapper">
               <ejs-pdfviewer id="pdfViewer"
                        [documentPath]="document"
                        [resourceUrl]="resource"
                        [pageOrganizerSettings]="{showImageZoomingSlider: true,}"
                        style="height:750px;display:block">
               </ejs-pdfviewer>
            </div>`,
   providers: [LinkAnnotationService, BookmarkViewService, MagnificationService,
      ThumbnailViewService, ToolbarService, NavigationService,
      AnnotationService, TextSearchService, TextSelectionService,
      FormFieldsService, FormDesignerService, PageOrganizerService, PrintService]
})
export class App {
   public document = 'https://cdn.syncfusion.com/content/pdf/pdf-succinctly.pdf';
   public resource = 'https://cdn.syncfusion.com/ej2/31.2.2/dist/ej2-pdfviewer-lib';
}
