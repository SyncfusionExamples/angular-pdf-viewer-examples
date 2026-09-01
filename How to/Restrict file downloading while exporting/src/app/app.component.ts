import { Component, ViewEncapsulation, OnInit } from '@angular/core';
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
  AnnotationService,
  FormFieldsService,
} from '@syncfusion/ej2-angular-pdfviewer';

/**
 * Default PdfViewer Controller
 */
@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  encapsulation: ViewEncapsulation.None,
  providers: [
    LinkAnnotationService,
    BookmarkViewService,
    MagnificationService,
    ThumbnailViewService,
    ToolbarService,
    NavigationService,
    TextSearchService,
    TextSelectionService,
    PrintService,
    AnnotationService,
    FormFieldsService,
  ],
})
export class AppComponent {
  public document: string = 'https://cdn.syncfusion.com/content/pdf/pdf-succinctly.pdf';
  ngOnInit(): void {
  }
  public exportStart(args): void {
    // Perform custom logic here
    if (args.exportData != null || args.formFieldData != null) {
      args.cancel = true;
    }

    // Cancelling the export operation
    // args.cancel = true;

    // Allowing the export operation to proceed
    //args.cancel = false;

    // Perform additional actions or logic based on your requirements
  }
}