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
  PdfViewerComponent
} from '@syncfusion/ej2-angular-pdfviewer';

@Component({
  selector: 'app-root',
  template: `
    <div class="content-wrapper">
       <button (click)="LoadDocument()">LoadDocument</button>
      <button (click)="SaveDocument()">SaveDocument</button>
      <ejs-pdfviewer 
        id="pdfViewer"
        [documentPath]="document" 
        [resourceUrl]="resourceUrl"
        style="height: 640px; display: block;">
      </ejs-pdfviewer>
    </div>
  `,
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

  ]
})
export class AppComponent implements OnInit {
  public document: string = 'https://cdn.syncfusion.com/content/pdf/pdf-succinctly.pdf';
  public resourceUrl: string = 'https://cdn.syncfusion.com/ej2/27.2.2/dist/ej2-pdfviewer-lib';
  public pdfviewerControl!: PdfViewerComponent;
  public downloadurl: string = 'https://localhost:7255/pdfviewer/Download';

  ngOnInit(): void { }


  //To Load Sample Document from the server.
  public LoadDocument() {
    var viewer = (<any>document.getElementById('pdfViewer')).ej2_instances[0];
    var xhr = new XMLHttpRequest();
    var fileName = 'gis-succinctly.docx';
    var url = `https://localhost:7255/pdfviewer/Load`;

    var data = {
      document: fileName,
      isFileName: true,
    };

    xhr.open('POST', url, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.responseType = 'arraybuffer';

    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4 && xhr.status === 200) {
        var blob = new Blob([xhr.response], { type: 'application/pdf' });
        var reader = new FileReader();

        reader.onload = function () {
          var base64String = reader.result;
          viewer.load(base64String);
        };

        reader.readAsDataURL(blob);
      }
    };

    xhr.send(JSON.stringify(data));
  }

  //To save the PDF with Annotations in server.
  public SaveDocument() {
    const viewer = (document.getElementById('pdfViewer') as any).ej2_instances[0];
    viewer.saveAsBlob()
      .then((blob: Blob) => {
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onload = (e: ProgressEvent<FileReader>) => {
          const base64String = e.target?.result;
          const xhr = new XMLHttpRequest();
          xhr.open('POST', this.downloadurl, true);
          xhr.setRequestHeader(
            'Content-type',
            'application/json; charset=UTF-8'
          );
          const requestData = JSON.stringify({ base64String });
          xhr.onload = () => {
            if (xhr.status === 200) {
              console.log('Download request success');
            } else {
              console.error('Download failed:', xhr.statusText);
            }
          };
          xhr.onerror = () => {
            console.error(
              'An error occurred during the download:',
              xhr.statusText
            );
          };
          xhr.send(requestData);
        };
      })
      .catch((error: any) => {
        console.error('Error saving Blob:', error);
      });
  }
}
