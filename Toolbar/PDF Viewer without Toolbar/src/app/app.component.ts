import { Component, OnInit } from '@angular/core';


@Component({
  selector: 'app-root',
  // specifies the template string for the PDF Viewer component
  template: `<div class="content-wrapper">
  <ejs-pdfviewer id="pdfViewer" [serviceUrl]='service' [enableToolbar]='false' [documentPath]='document' style="height:640px;display:block"></ejs-pdfviewer>
</div>`,  
})

export class AppComponent implements OnInit {
public service = 'https://ej2services.syncfusion.com/production/web-services/api/pdfviewer';
public document = 'PDF_Succinctly.pdf';
ngOnInit(): void {
}
}
