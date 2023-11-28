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
  <button (click)="remove()">Signature Remove</button>
                <ejs-pdfviewer id="pdfViewer"
                    [resourceUrl]='resource' 
                    [documentPath]='document'
                    style="height:640px;display:block">
                </ejs-pdfviewer>
             </div>`,
  providers: [ LinkAnnotationService, BookmarkViewService, MagnificationService,
               ThumbnailViewService, ToolbarService, NavigationService,
               TextSearchService, TextSelectionService, PrintService,
               AnnotationService, FormDesignerService, FormFieldsService]
})
export class AppComponent implements OnInit {
 
  // To utilize the server-backed PDF Viewer, need to specify the service URL. This can be done by including the **[serviceUrl]='service'** attribute within the <ejs-pdfviewer></ejs-pdfviewer> component in app.component.html file.
  public service: string = 'https://services.syncfusion.com/angular/production/api/pdfviewer';

  //Document path to load the PDF document
  public document: string = 'https://cdn.syncfusion.com/content/pdf/form-filling-document.pdf';
  public resource: string = 'https://cdn.syncfusion.com/ej2/23.1.43/dist/ej2-pdfviewer-lib';
  ngOnInit(): void {
  }
  //Method to remove signature from signature field
  remove() {
    var viewer = (<any>document.getElementById('pdfViewer')).ej2_instances[0];
    var forms = viewer.retrieveFormFields();
    viewer.clearFormFields(forms[8]);
  }
}
