import { Component, ViewChild, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PdfViewerComponent, LinkAnnotationService, BookmarkViewService, MagnificationService, ThumbnailViewService, ToolbarService, NavigationService, TextSearchService, TextSelectionService, PrintService, AnnotationService, FormFieldsService, FormDesignerService, PageOrganizerService,PdfViewerModule } from '@syncfusion/ej2-angular-pdfviewer';

@Component({
  selector: 'app-nx-welcome',
  styleUrl: 'app.css',
imports: [CommonModule, PdfViewerModule],
  template: `
   <div class="control-section">
    <div class="content-wrapper">
        <ejs-pdfviewer #pdfviewer id="pdfViewer" [documentPath]='document' [resourceUrl]='resource'style="height:640px;display:block"></ejs-pdfviewer>
    </div>
  </div>
  `,
  providers: [LinkAnnotationService, BookmarkViewService, MagnificationService, ThumbnailViewService, ToolbarService, NavigationService,
        TextSearchService, TextSelectionService, PrintService, AnnotationService, FormFieldsService, FormDesignerService,PageOrganizerService],
  styles: [],
  encapsulation: ViewEncapsulation.None,
})
export class NxWelcome {    
  @ViewChild('pdfviewer')
    public pdfviewerControl: PdfViewerComponent | undefined;
    
    public document: string = 'https://cdn.syncfusion.com/content/pdf/pdf-succinctly.pdf';
    public resource:string = "https://cdn.syncfusion.com/ej2/23.2.6/dist/ej2-pdfviewer-lib";
  }
