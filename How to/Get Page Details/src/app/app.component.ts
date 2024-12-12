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
      <button (click)="retrievePageInfo()" style="margin-bottom: 20px;">Get Page Info</button>
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

  retrievePageInfo() {
    const viewer = (document.getElementById('pdfViewer') as any).ej2_instances[0];
    // Set the page index for which info is required
    const pageIndex = 0;
    // To Retrieve and log the page information
    console.log(viewer.getPageInfo(pageIndex));
    
    // To Log the specific page information details to the console
    const pageInfo = viewer.getPageInfo(pageIndex);
    if (pageInfo) {
      console.log(`Page Info for Page Index ${pageIndex}:`);
      console.log(`Height: ${pageInfo.height}`);
      console.log(`Width: ${pageInfo.width}`);
      console.log(`Rotation: ${pageInfo.rotation}`);
    } 
  }
}
