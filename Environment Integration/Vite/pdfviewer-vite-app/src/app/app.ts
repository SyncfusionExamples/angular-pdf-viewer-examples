import { Component, ViewChild, ViewEncapsulation, signal } from '@angular/core';
import {
  PdfViewerComponent, PdfViewerModule, LinkAnnotationService,
  BookmarkViewService, MagnificationService,
  ThumbnailViewService, ToolbarService,
  NavigationService, TextSearchService,
  TextSelectionService, PrintService,
  AnnotationService, FormFieldsService,
  FormDesignerService, PageOrganizerService
} from '@syncfusion/ej2-angular-pdfviewer';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [PdfViewerModule],
  template: `
    <div class="control-section">
      <div class="content-wrapper">
        <ejs-pdfviewer
          [documentPath]="document"
          [resourceUrl]="resource"
          style="height: 640px; display: block;">
        </ejs-pdfviewer>
      </div>
    </div>
  `,
  providers: [
    LinkAnnotationService, BookmarkViewService,
    MagnificationService, ThumbnailViewService,
    ToolbarService, NavigationService,
    TextSearchService, TextSelectionService,
    PrintService, AnnotationService,
    FormFieldsService, FormDesignerService,
    PageOrganizerService
  ],
  encapsulation: ViewEncapsulation.None,
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('pdfviewer-vite-app');

  @ViewChild('pdfviewer')
  public pdfviewerControl?: PdfViewerComponent;

  public document = 'https://cdn.syncfusion.com/content/pdf/pdf-succinctly.pdf';
  public resource = 'https://cdn.syncfusion.com/ej2/23.2.6/dist/ej2-pdfviewer-lib';
}