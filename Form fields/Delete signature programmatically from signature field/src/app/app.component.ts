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
  public service: string =
  'https://ej2services.syncfusion.com/production/web-services/api/pdfviewer';
  //Document path to load the PDF document
  public document: string = 'FormFillingDocument.pdf';
  ngOnInit(): void {
  }
  //Method to remove signature from signature field
  remove() {
    var viewer = (<any>document.getElementById('pdfViewer')).ej2_instances[0];
    var forms = viewer.retrieveFormFields();
    viewer.clearFormFields(forms[8]);
  }
}
