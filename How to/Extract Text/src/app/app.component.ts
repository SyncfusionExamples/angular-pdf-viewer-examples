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
    <button #btn1 (click)="extrctText()">extrctText</button>
    <button #btn2 (click)="extrctsText()">extrctsText</button>
      <ejs-pdfviewer 
        id="pdfViewer"
        [resourceUrl]="resourceUrl"
        [documentPath]="document"
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
  public resourceUrl: string = 'https://cdn.syncfusion.com/ej2/29.1.33/dist/ej2-pdfviewer-lib';

  ngOnInit(): void { }
  // Function to extract text from a specific page (page 1)
 extrctText(): void {   
  const viewer = (document.getElementById('pdfViewer') as any).ej2_instances[0];
  viewer.extractText(1, 'TextOnly').then((val: any) => {
     console.log('Extracted Text from Page 1:');
      console.log(val);
  });
}

// Function to extract text from a range of pages (pages 0 to 2)
extrctsText(): void {    
  const viewer = (document.getElementById('pdfViewer') as any).ej2_instances[0];                                                             
  viewer.extractText(0, 2, 'TextOnly').then((val: any) => {
     console.log('Extracted Text from Pages 0 to 2:');
     console.log(val);
  });
}

}
