import { Component } from '@angular/core';
import { PdfViewerModule, LinkAnnotationService, BookmarkViewService,
         MagnificationService, ThumbnailViewService, ToolbarService,
         NavigationService, TextSearchService, TextSelectionService,
         PrintService, FormDesignerService, FormFieldsService,
         AnnotationService, PageOrganizerService } from '@syncfusion/ej2-angular-pdfviewer';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [PdfViewerModule],
  providers: [ LinkAnnotationService, BookmarkViewService, MagnificationService,
               ThumbnailViewService, ToolbarService, NavigationService,
               TextSearchService, TextSelectionService, PrintService,
               FormDesignerService, FormFieldsService, AnnotationService, PageOrganizerService],
  template: `
    <ejs-pdfviewer
      id="pdfViewer"
      [documentPath]="documentPath"
      [resourceUrl]="resourcesUrl"
      [tileRenderingSettings]='tileRendering'
      style="height:640px; display:block">
    </ejs-pdfviewer>
  `
})
export class App {
  public documentPath: string = 'https://cdn.syncfusion.com/content/pdf/pdf-succinctly.pdf';
  public resourcesUrl: string = 'https://cdn.syncfusion.com/ej2/34.2.8/dist/ej2-pdfviewer-lib';
  public tileRendering = {
      enableTileRendering: false,
  };
}