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
      <button (click)="getBase64()" style="margin-bottom: 20px;">Get Base64</button>
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
    PrintService
  ]
})
export class AppComponent implements OnInit {
  public document: string = 'https://cdn.syncfusion.com/content/pdf/pdf-succinctly.pdf';
  public resourceUrl: string = 'https://cdn.syncfusion.com/ej2/27.2.2/dist/ej2-pdfviewer-lib';

  ngOnInit(): void { }

  getBase64() {
    const viewer = (document.getElementById('pdfViewer') as any).ej2_instances[0];
    viewer.saveAsBlob().then((blobData: Blob) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64data = reader.result;
        console.log(base64data);
      };
      reader.readAsDataURL(blobData);
    });
  }
}
