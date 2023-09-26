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
  FormDesignerService
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
    FormDesignerService
  ],
})
export class AppComponent {

  // To utilize the server-backed PDF Viewer, need to specify the service URL. This can be done by including the **[serviceUrl]='service'** attribute within the <ejs-pdfviewer></ejs-pdfviewer> component in app.component.html file.
  //public service: string ='https://ej2services.syncfusion.com/production/web-services/api/pdfviewer';

  public document: string = 'https://cdn.syncfusion.com/content/pdf/pdf-succinctly.pdf';

  ngOnInit(): void {
  }

  //Method to add free text annotation programmatically.
  AddFreeText() {
    var pdfviewer = (<any>document.getElementById('pdfViewer')).ej2_instances[0];
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
    pdfviewer.annotationModule.setAnnotationMode('Circle');
  }
}
