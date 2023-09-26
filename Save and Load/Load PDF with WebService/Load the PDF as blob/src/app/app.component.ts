
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
  PrintService
} from '@syncfusion/ej2-angular-pdfviewer';

@Component({
  selector: 'app-root',
  // specifies the template string for the PDF Viewer component
  template: `<div class="content-wrapper">
  <button (click)="save()">SaveDocument</button>
  <button (click)="load_2()">LoadDocument</button>
  <div class="content-wrapper">
    <ejs-pdfviewer
      id="pdfViewer"
      [serviceUrl]="service"
      [documentPath]="document"
      style="height:640px;display:block"
    ></ejs-pdfviewer>
  </div>
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
    PrintService
  ]
})

export class AppComponent implements OnInit {
public service = 'https://localhost:44309/pdfviewer';
public document = 'https://cdn.syncfusion.com/content/pdf/form-designer.pdf';
ngOnInit(): void {
}
save() {
  var viewer = (<any>document.getElementById('pdfViewer')).ej2_instances[0];
  var data:Blob;
  viewer.saveAsBlob().then(function(value:any) {
    data = value;
    var reader = new FileReader();
    reader.readAsDataURL(data);
    reader.onload = () => {
      base64data = reader.result;
      console.log(base64data);
      viewer.load(base64data, null);
    };
  });
}
load_2() {
  // Load PDF document using file name
  var viewer = (<any>document.getElementById('pdfViewer')).ej2_instances[0];
  viewer.load(base64data, null);
}
}
var base64data: string | ArrayBuffer|null;