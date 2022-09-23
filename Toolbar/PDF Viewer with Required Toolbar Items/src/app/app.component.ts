
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
  <ejs-pdfviewer id="pdfViewer" [serviceUrl]='service' [toolbarSettings]='toolbarSettings' [documentPath]='document' style="height:640px;display:block"></ejs-pdfviewer>
</div>`,
  providers: [
    MagnificationService,     
    ToolbarService, 
    NavigationService, 
    PrintService]
})
export class AppComponent implements OnInit {
public service = 'https://ej2services.syncfusion.com/production/web-services/api/pdfviewer';
public document = 'FormFillingDocument.pdf';
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
