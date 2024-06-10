import { Component, OnInit, ViewEncapsulation, ViewChild } from '@angular/core';
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
  PageOrganizerService
} from '@syncfusion/ej2-angular-pdfviewer';

@Component({
  selector: 'app-root',
  template: `<div class="content-wrapper">
    <!--Render PDF Viewer component-->
    <ejs-pdfviewer id="pdfViewer"
        [documentPath]='document'
        [resourceUrl]='resource' 
        (downloadStart)="downloadStart($event)"
        style="height:640px;display:block">
    </ejs-pdfviewer>
             </div>`,
  encapsulation: ViewEncapsulation.None,

  providers: [
    LinkAnnotationService,
    BookmarkViewService,
    MagnificationService,
    ThumbnailViewService,
    ToolbarService,
    NavigationService,
    TextSearchService,
    TextSelectionService,
    PrintService,
    AnnotationService,
    FormFieldsService,
    FormDesignerService,
    PageOrganizerService
  ],
})


export class AppComponent implements OnInit {
  public document = 'https://cdn.syncfusion.com/content/pdf/pdf-succinctly.pdf';
  public resource: string = 'https://cdn.syncfusion.com/ej2/24.1.41/dist/ej2-pdfviewer-lib';

  ngOnInit(): void {
  }

  public downloadStart(args: any): void {
    // Your custom logic here
    args.cancel = true; // Prevent download action
  }

}