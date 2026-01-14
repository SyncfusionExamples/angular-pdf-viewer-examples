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
      <!-- Separate buttons: Show and Hide Redaction toolbar -->
      <div style="margin-bottom:8px; display:flex; gap:8px;">
        <button type="button" (click)="showRedactionToolbar()">Show Redaction Toolbar</button>
        <button type="button" (click)="hideRedactionToolbar()">Hide Redaction Toolbar</button>
      </div>
      <ejs-pdfviewer
        #pdfviewer
        id="pdfViewer"
        [resourceUrl]="resource"
        [documentPath]="document"
        [toolbarSettings]="toolbarSettings"
        style="height:640px; display:block">
      </ejs-pdfviewer>
    </div>
  `,
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
    PrintService,
    FormFieldsService,
    FormDesignerService,
    PageOrganizerService
  ]
})
export class AppComponent {
  @ViewChild('pdfviewer', { static: true }) pdfViewer!: PdfViewerComponent;

  // Standalone assets (keep version aligned with your installed package)
  public resource = 'https://cdn.syncfusion.com/ej2/31.2.2/dist/ej2-pdfviewer-lib';
  public document = 'https://cdn.syncfusion.com/content/pdf/pdf-succinctly.pdf';

  // Includes RedactionEditTool in the primary toolbar
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
      'RedactionEditTool',   // primary-bar entry to access the Redaction toolbar
      'FormDesignerEditTool',
      'SearchOption',
      'PrintOption',
      'DownloadOption'
    ]
  };

  // Separate handlers for show/hide (no toggle)
  showRedactionToolbar(): void {
    this.pdfViewer.toolbar.showRedactionToolbar(true);
  }

  hideRedactionToolbar(): void {
    this.pdfViewer.toolbar.showRedactionToolbar(false);
  }
}