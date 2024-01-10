import { Component, OnInit } from '@angular/core';
import { LinkAnnotationService, BookmarkViewService, MagnificationService,
         ThumbnailViewService, ToolbarService, NavigationService,
         AnnotationService, TextSearchService, TextSelectionService,
         PrintService, FormDesignerService, FormFieldsService
       } from '@syncfusion/ej2-angular-pdfviewer';

@Component({
  selector: 'app-root',
  // specifies the template string for the PDF Viewer component
  template: `<div class="content-wrapper">
                <ejs-pdfviewer id="pdfViewer"
                    [resourceUrl]='resource' 
                    [documentPath]='document'
                    (exportSuccess)="fireExportRequestSuccess()"
                    style="height:640px;display:block">
                </ejs-pdfviewer>
             </div>`,
  providers: [ LinkAnnotationService, BookmarkViewService, MagnificationService,
               ThumbnailViewService, ToolbarService, NavigationService,
               TextSearchService, TextSelectionService, PrintService,
               AnnotationService, FormDesignerService, FormFieldsService]
})
export class AppComponent implements OnInit {

  public document = "https://cdn.syncfusion.com/content/pdf/form-filling-document.pdf";
  public resource: string = 'https://cdn.syncfusion.com/ej2/24.1.41/dist/ej2-pdfviewer-lib';
  // To utilize the server-backed PDF Viewer, need to specify the service URL. This can be done by including the **[serviceUrl]='service'** attribute within the <ejs-pdfviewer></ejs-pdfviewer> component in app.component.html file.
  //public service: string = 'https://services.syncfusion.com/angular/production/api/pdfviewer';
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

