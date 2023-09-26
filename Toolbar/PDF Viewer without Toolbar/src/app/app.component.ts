import { Component, OnInit } from '@angular/core';


@Component({
  selector: 'app-root',
  // specifies the template string for the PDF Viewer component
  template: `<div class="content-wrapper">
  <ejs-pdfviewer 
    id="pdfViewer" 
    [enableToolbar]='false' 
    [documentPath]='document' 
    style="height:640px;display:block">
  </ejs-pdfviewer>
</div>`,  
})

export class AppComponent implements OnInit {
  
// To utilize the server-backed PDF Viewer, need to specify the service URL. Within the template, configure the PDF Viewer by adding the **[serviceUrl]='service'** attribute inside the div element.
//public service = 'https://ej2services.syncfusion.com/production/web-services/api/pdfviewer';

public document = 'https://cdn.syncfusion.com/content/pdf/pdf-succinctly.pdf';
ngOnInit(): void {
}
}
