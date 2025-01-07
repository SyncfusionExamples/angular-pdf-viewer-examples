import { Component, OnInit } from '@angular/core';
import {
  LinkAnnotationService,
  BookmarkViewService,
  MagnificationService,
  ThumbnailViewService,
  ToolbarService,
  NavigationService,
  AnnotationService,
  TextSearchService,
  TextSelectionService,
  FormFieldsService,
  FormDesignerService,
  PrintService
} from '@syncfusion/ej2-angular-pdfviewer';

@Component({
  selector: 'app-root',
  // specifies the template string for the PDF Viewer component
  template: `<div class="content-wrapper">
  <button (click)="ExportAsJson()" >ExportAsJson</button>
  <button (click)="ExportAsXfdf()" >ExportAsXfdf</button>
  <button (click)="ExportAsObject()" >ExportAsObject</button>
  <button (click)="Import()" >Import</button>
  <ejs-pdfviewer id="pdfViewer"
             [documentPath]='document'
              [resourceUrl]='resource' 
             style="height:640px;display:block">
  </ejs-pdfviewer>
</div>`,
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
    FormFieldsService,
    FormDesignerService,
    PrintService]
})
export class AppComponent implements OnInit {
  public document = 'https://cdn.syncfusion.com/content/pdf/pdf-succinctly.pdf';
  public resource: string = 'https://cdn.syncfusion.com/ej2/28.1.33/dist/ej2-pdfviewer-lib';
  ngOnInit(): void {
  }
    // export the annotation in JSON format.
    ExportAsJson(): void {
      var viewer = (<any>document.getElementById('pdfViewer')).ej2_instances[0];
      viewer.exportAnnotation('Json');
    }
    // export the annotation in XFDF format.
    ExportAsXfdf(): void {
      var viewer = (<any>document.getElementById('pdfViewer')).ej2_instances[0];
      viewer.exportAnnotation('Xfdf');
    }
    // export the annotation as object.
    ExportAsObject(): void {
      var viewer = (<any>document.getElementById('pdfViewer')).ej2_instances[0];
      return viewer.exportAnnotationsAsObject().then((value: any) => {
        exportObject = value;
      });
    }
    //Import annotation that are exported as object.
    Import(): void {
      var viewer = (<any>document.getElementById('pdfViewer')).ej2_instances[0];
        viewer.importAnnotation(JSON.parse(exportObject));
    }
}
let exportObject: any;