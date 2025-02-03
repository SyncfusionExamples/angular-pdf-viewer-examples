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
  PrintService,
  PageOrganizerService
} from '@syncfusion/ej2-angular-pdfviewer';

@Component({
  selector: 'app-root',
  // specifies the template string for the PDF Viewer component
  template: `<div class="content-wrapper">
  <button (click)="HideAnnotations()">Hide Annotations</button>
  <button (click)="UnHideAnnotations()">Unhide Annotations</button>
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
    PrintService,
    PageOrganizerService]
})
export class AppComponent implements OnInit {
  public document = 'https://cdn.syncfusion.com/content/pdf/pdf-succinctly.pdf';
  public resource: string = 'https://cdn.syncfusion.com/ej2/27.1.48/dist/ej2-pdfviewer-lib';;
  ngOnInit(): void {
  }

  public exportObject: any;

  HideAnnotations() {
    var proxy = this;
    var viewer = (<any>document.getElementById('pdfViewer')).ej2_instances[0];
    viewer.exportAnnotationsAsObject().then(function (value: any) {
      proxy.exportObject = value;
      viewer.deleteAnnotations();
    });
  }

  UnHideAnnotations() {
    var viewer = (<any>document.getElementById('pdfViewer')).ej2_instances[0];
    viewer.importAnnotation(JSON.parse(this.exportObject));
  }
}