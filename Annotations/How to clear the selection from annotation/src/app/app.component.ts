
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
  FormFieldsService,
  FormDesignerService
} from '@syncfusion/ej2-angular-pdfviewer';

@Component({
  selector: 'app-root',
  // specifies the template string for the PDF Viewer component
  template: `<div class="content-wrapper">
  <ejs-pdfviewer 
    id="pdfViewer" 
    (exportSuccess)="fireExportRequestSuccess()"
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
    FormDesignerService
  ]
})
export class AppComponent implements OnInit {

  public document = "https://cdn.syncfusion.com/content/pdf/form-filling-document.pdf";
  public resource: string = 'https://cdn.syncfusion.com/ej2/23.1.43/dist/ej2-pdfviewer-lib';
  ngOnInit(): void {
  }
  //Method to notify popup once form is submitted.
  public fireExportRequestSuccess() {
    var pdfViewer = (<any>document.getElementById('pdfViewer'))
      .ej2_instances[0];
    pdfViewer.viewerBase.openImportExportNotificationPopup(
      'Your form information has been saved. You can resume it at any times.Form Information Saved'
    );
  }
}

