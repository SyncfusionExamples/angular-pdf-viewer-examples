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
  public document: string = 'PDF_Succinctly.pdf';
  ngOnInit(): void {
  }
  //Method to add free text annotation programmatically.
  AddFreeText() {
    var pdfviewer = (<any>document.getElementById('pdfViewer'))
      .ej2_instances[0];
    pdfviewer.freeTextSettings.width = 200;
    pdfviewer.freeTextSettings.height = 50;
    pdfviewer.freeTextSettings.textAlignment = 'Center';
    pdfviewer.freeTextSettings.borderStyle = 'solid';
    pdfviewer.freeTextSettings.borderWidth = 2;
    pdfviewer.freeTextSettings.borderColor = 'blue';
    pdfviewer.freeTextSettings.fillColor = 'blue';
    pdfviewer.freeTextSettings.fontSize = 14;
    pdfviewer.freeTextSettings.fontColor = 'black';
    pdfviewer.freeTextSettings.defaultText = 'Dinuka';
    pdfviewer.freeTextSettings.isReadonly = true;
    pdfviewer.annotationModule.setAnnotationMode('FreeText');
  }
  //Method to remove the selection from free text annotation.
  RemoveFreeText() {
    var pdfviewer = (<any>document.getElementById('pdfViewer'))
      .ej2_instances[0];
    pdfviewer.annotationModule.setAnnotationMode('None');
  }
}
