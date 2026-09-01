import { Component, ViewChild } from '@angular/core';
import {
  PdfViewerComponent,
  LinkAnnotationService,
  BookmarkViewService,
  MagnificationService,
  ThumbnailViewService,
  ToolbarService,
  NavigationService,
  AnnotationService,
  TextSearchService,
  TextSelectionService,
  PrintService,
  FormFieldsService,
  FormDesignerService,
  PageOrganizerService,
  ToolbarSettingsModel
} from '@syncfusion/ej2-angular-pdfviewer';

@Component({
  selector: 'app-root',
  template: `
    <div class="content-wrapper">
      <div style="margin-bottom:8px;display:flex;gap:8px;align-items:center;">
        <button id="searchTextRedact" type="button" (click)="searchTextAndRedact()">
          Search "syncfusion" & Mark for Redaction
        </button>
        <button id="applyRedaction" type="button" (click)="applyRedaction()">
          Apply Redaction
        </button>
      </div>

      <ejs-pdfviewer
        #pdfviewer
        id="PdfViewer"
        [documentPath]="document"
        [resourceUrl]="resource"
        [toolbarSettings]="toolbarSettings"
        [isExtractText]="true"
        style="height:640px;display:block">
      </ejs-pdfviewer>
    </div>
  `,
  providers: [
    // Angular DI is the Angular equivalent of PdfViewer.Inject(...)
    LinkAnnotationService,
    BookmarkViewService,
    MagnificationService,
    ThumbnailViewService,
    ToolbarService,
    NavigationService,
    AnnotationService,
    TextSearchService,
    TextSelectionService,
    PrintService,
    FormFieldsService,
    FormDesignerService,
    PageOrganizerService
  ]
})
export class AppComponent {
  @ViewChild('pdfviewer', { static: true }) pdfViewer!: PdfViewerComponent;

  // Same sources as in your JS
  public document = 'https://cdn.syncfusion.com/content/pdf/pdf-succinctly.pdf';
  public resource = 'https://cdn.syncfusion.com/ej2/31.2.2/dist/ej2-pdfviewer-lib';

  // Primary toolbar including Redaction
  public toolbarSettings: ToolbarSettingsModel = {
    toolbarItems: [
      'OpenOption',
      'UndoRedoTool',
      'PageNavigationTool',
      'MagnificationTool',
      'PanTool',
      'SelectionTool',
      'CommentTool',
      'SubmitForm',
      'AnnotationEditTool',
      'RedactionEditTool',   // show Redaction entry in main toolbar
      'FormDesignerEditTool',
      'SearchOption',
      'PrintOption',
      'DownloadOption'
    ]
  };

  /**
   * Finds the term "syncfusion" across the document and adds Redaction annotations
   * on top of every match (converts 72-dpi bounds to 96-dpi for addAnnotation).
   */
  async searchTextAndRedact(): Promise<void> {
    const term = 'syncfusion';
    // Use async search so we don't depend on extractTextCompleted timing.
    const results = await this.pdfViewer.textSearchModule.findTextAsync(term, false);
    if (!results || results.length === 0) {
      console.warn('No matches found.');
      return;
    }

    const px = (pt: number) => (pt * 96) / 72; // convert from points to pixels

    for (const pageResult of results) {
      if (!pageResult || !pageResult.bounds || pageResult.bounds.length === 0) { continue; }
      if (pageResult.pageIndex == null) { continue; } // guard
      const pageNumber = pageResult.pageIndex + 1;     // API expects 1-based

      for (const bound of pageResult.bounds) {
        this.pdfViewer.annotation.addAnnotation('Redaction', {
          bound: {
            x: px(bound.x),
            y: px(bound.y),
            width: px(bound.width),
            height: px(bound.height)
          },
          pageNumber,
          overlayText: 'Confidential',
          fillColor: '#00FF40FF',
          fontColor: '#333333',
          fontSize: 12,
          fontFamily: 'Arial',
          markerFillColor: '#FF0000',
          markerBorderColor: '#000000'
        } as any); // 'as any' to accept redaction-specific options
      }
    }
  }

  /** Permanently applies all redaction marks in the document. */
  applyRedaction(): void {
    this.pdfViewer.annotation.redact();
  }
}
