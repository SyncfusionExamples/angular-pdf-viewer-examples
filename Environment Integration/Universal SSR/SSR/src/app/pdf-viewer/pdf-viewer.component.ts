import { Component, PLATFORM_ID, Inject, OnInit, NO_ERRORS_SCHEMA } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { PdfViewerModule, LinkAnnotationService, BookmarkViewService,
         MagnificationService, ThumbnailViewService, ToolbarService,
         NavigationService, TextSearchService, TextSelectionService,
         PrintService, FormDesignerService, FormFieldsService,
         AnnotationService, PageOrganizerService } from '@syncfusion/ej2-angular-pdfviewer';

@Component({
  selector: 'app-pdf-viewer',
  standalone: true,
  imports: [CommonModule, PdfViewerModule],
  schemas: [NO_ERRORS_SCHEMA],
  template: `
    <div class="pdf-viewer-container">
      <h2>Syncfusion PDF Viewer</h2>
      <div *ngIf="isBrowser" class="viewer-wrapper">
        <ejs-pdfviewer 
          id="pdfViewer"
          [documentPath]="documentPath"
          [resourceUrl]="resourceUrl"
          style="height:640px;display:block">
        </ejs-pdfviewer>
      </div>
      <div *ngIf="!isBrowser" class="ssr-placeholder">
        <p>PDF Viewer loads on client-side (SSR compatible)</p>
      </div>
    </div>
  `,
  styles: [`
    .pdf-viewer-container {
      padding: 20px;
      background: #f5f5f5;
      border-radius: 8px;
      margin-top: 20px;
    }

    .pdf-viewer-container h2 {
      margin-top: 0;
      color: #333;
      font-size: 1.5rem;
    }

    .viewer-wrapper {
      height: 650px;
      border: 1px solid #ddd;
      border-radius: 4px;
      background: white;
      overflow: hidden;
    }

    .ssr-placeholder {
      height: 200px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: white;
      border: 1px solid #ddd;
      border-radius: 4px;
      color: #999;
    }

    ::ng-deep .e-pdfviewer {
      width: 100%;
      height: 100%;
    }

    ::ng-deep .e-pdfviewer-toolbar {
      background: #f0f0f0;
      border-bottom: 1px solid #ddd;
    }
  `],
  providers: [ 
    LinkAnnotationService, BookmarkViewService, MagnificationService,
    ThumbnailViewService, ToolbarService, NavigationService,
    TextSearchService, TextSelectionService, PrintService,
    AnnotationService, FormDesignerService, FormFieldsService, PageOrganizerService
  ]
})
export class PdfViewerComponent implements OnInit {
  isBrowser: boolean;
  documentPath: string = '';
  resourceUrl: string = '';

  constructor(@Inject(PLATFORM_ID) private platformId: object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    if (this.isBrowser) {
      this.documentPath = "https://cdn.syncfusion.com/content/pdf/pdf-succinctly.pdf";
      this.resourceUrl = "https://cdn.syncfusion.com/ej2/31.1.23/dist/ej2-pdfviewer-lib";
      console.log('Syncfusion PDF Viewer initialized on client-side');
      console.log('Document Path:', this.documentPath);
      console.log('Resource URL:', this.resourceUrl);
    }
  }
}
