
import { Component, OnInit } from '@angular/core';
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

@Component({
  selector: 'app-root',
  // specifies the template string for the PDF Viewer component
  template: `<div class="content-wrapper">
  <button (click)="AddFreeText()">AddFreeText</button>
  <button (click)="RemoveFreeText()">RemoveFreeTextSelection</button>
  <ejs-pdfviewer 
    id="pdfViewer" 
    [documentPath]='document' 
    [resourceUrl]='resource' 
    style="height:640px;
    display:block">
  </ejs-pdfviewer>
</div>`,
  providers: [
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
    FormFieldsService,
    FormDesignerService,
    AnnotationService
  ]
})
export class AppComponent implements OnInit {

  public document = "https://cdn.syncfusion.com/content/pdf/pdf-succinctly.pdf";
  public resource: string = 'https://cdn.syncfusion.com/ej2/24.1.41/dist/ej2-pdfviewer-lib';
  // To utilize the server-backed PDF Viewer, need to specify the service URL. This can be done by including the **[serviceUrl]='service'** attribute within the <ejs-pdfviewer></ejs-pdfviewer> component in app.component.html file.
  //public service: string = 'https://services.syncfusion.com/angular/production/api/pdfviewer';
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
    pdfviewer.freeTextSettings.defaultText = 'Syncfusion';
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