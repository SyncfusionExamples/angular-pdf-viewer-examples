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
        (pageRenderInitiate)='pageRenderInitiate($event)'
        (pageRenderComplete)='pageRenderComplete($event)'
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
  ;
  ngOnInit(): void {
  }
  public pageRenderInitiate(args: any): void {
    // This method is called when the page rendering starts
    console.log("Rendering of pages started");
    console.log(args)
  }
  
  public pageRenderComplete(args: any): void {
    // This method is called when the page rendering completes
   console.log('Rendering of pages completed');
   console.log(args)
  }
  
}