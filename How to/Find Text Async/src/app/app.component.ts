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
    <button #btn1 (click)="findText()">findText</button>
    <button #btn2 (click)="findTexts()">findTexts</button>
      <ejs-pdfviewer 
        id="pdfViewer"
        [resourceUrl]="resourceUrl"
        [documentPath]="document"
        [enableLocalStorage]="true"
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

  findText(): void {     
    const viewer = (document.getElementById('pdfViewer') as any).ej2_instances[0];
    //Search for a single string ('pdf') with a case-insensitive search across all pages
    viewer.textSearchModule.findTextAsync('pdf', false).then((res: any) =>{
        console.log(res);
    });
}
findTexts(): void { 
  const viewer = (document.getElementById('pdfViewer') as any).ej2_instances[0];
   //Search for multiple strings (['pdf', 'the']) with a case-insensitive search across all pages
    viewer.textSearchModule.findTextAsync(['pdf', 'the'], false).then((res: any) =>{
        console.log(res);
    });
}
}
