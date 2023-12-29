
import { Component, OnInit } from '@angular/core';
import {
  MagnificationService, 
  ToolbarService, 
  NavigationService, 
  PrintService
} from '@syncfusion/ej2-angular-pdfviewer';

@Component({
  selector: 'app-root',
  // specifies the template string for the PDF Viewer component
  template: `<div class="content-wrapper">
  <ejs-pdfviewer 
    id="pdfViewer" 
    [toolbarSettings]='toolbarSettings' 
    [documentPath]='document' 
    [resourceUrl]='resource' 
    style="height:640px;display:block">
  </ejs-pdfviewer>
</div>`,
  providers: [
    MagnificationService,     
    ToolbarService, 
    NavigationService, 
    PrintService]
})
export class AppComponent implements OnInit {
// To utilize the server-backed PDF Viewer, need to specify the service URL. Within the template, configure the PDF Viewer by adding the **[serviceUrl]='service'** attribute inside the div element.
//public service = 'https://services.syncfusion.com/angular/production/api/pdfviewer';

public document = 'https://cdn.syncfusion.com/content/pdf/form-filling-document.pdf';
public resource: string = 'https://cdn.syncfusion.com/ej2/24.1.41/dist/ej2-pdfviewer-lib';
public toolbarSettings = {
  showTooltip: true,
  toolbarItems: [
    'OpenOption',
    'PageNavigationTool',
    'MagnificationTool',
    'PrintOption',
    'DownloadOption',
  ],
};

  ngOnInit(): void {
  }
}
