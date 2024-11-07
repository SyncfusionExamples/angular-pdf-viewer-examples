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
  template: `
    <div class="content-wrapper">
      <ejs-pdfviewer 
        id="pdfViewer"
        [documentPath]="document" 
        [serviceUrl]="serviceUrl" 
        style="height: 640px; display: block;"
        (exportSuccess)="handleExportSuccess($event)">
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
    PrintService
  ]
})
export class AppComponent implements OnInit {
  public document: string = 'https://cdn.syncfusion.com/content/pdf/pdf-succinctly.pdf';
  public serviceUrl: string = 'https://services.syncfusion.com/js/production/api/pdfviewer';

  ngOnInit(): void { }

  findTextBounds() {
    const viewer = (document.getElementById('pdfViewer') as any).ej2_instances[0];
    console.log(viewer.textSearch.findText(['pdf', 'adobe'], false, 7));
  }

  // Event for export success
  handleExportSuccess(args: any) {
    const blobURL = args.exportData;
    // Converting the exported blob into object
    this.convertBlobURLToObject(blobURL)
      .then(objectData => {
        console.log(objectData);
        const shapeAnnotationData = objectData.pdfAnnotation[0].shapeAnnotation;
        shapeAnnotationData.forEach((data: any) => {
          if (data && data.rect && parseInt(data.rect.width)) {
            const viewer = (document.getElementById('pdfViewer') as any).ej2_instances[0];
            const pageHeight = viewer.getPageInfo(parseInt(data.page)).height;
            // Converting PDF Library values into PDF Viewer values.
            const rect = {
              x: (parseInt(data.rect.x) * 96) / 72,
              y: (parseInt(pageHeight) - parseInt(data.rect.height)) * 96 / 72,
              width: (parseInt(data.rect.width) - parseInt(data.rect.x)) * 96 / 72,
              height: (parseInt(data.rect.height) - parseInt(data.rect.y)) * 96 / 72,
            };
            console.log(data.name);
            console.log(rect);
            console.log("-------------------------");
          }
        });
      })
      .catch(error => {
        console.error('Error converting Blob URL to object:', error);
      });
  }

  // Function to convert Blob URL to object
  convertBlobURLToObject(blobURL: string): Promise<any> {
    return fetch(blobURL)
      .then(response => response.blob())
      .then(blobData => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            resolve(JSON.parse(reader.result as string));
          };
          reader.onerror = reject;
          reader.readAsText(blobData);
        });
      });
  }
}
