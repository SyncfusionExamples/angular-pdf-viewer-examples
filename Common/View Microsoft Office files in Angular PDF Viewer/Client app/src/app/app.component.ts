import { Component, OnInit } from '@angular/core';
import {
  LinkAnnotationService, BookmarkViewService, MagnificationService,
  ThumbnailViewService, ToolbarService, NavigationService,
  AnnotationService, TextSearchService, TextSelectionService,
  PrintService, FormFieldsService, FormDesignerService
} from '@syncfusion/ej2-angular-pdfviewer';

@Component({
  selector: 'app-root',
  // specifies the template string for the PDF Viewer component
  template: 
    `<div class="content-wrapper">
                <ejs-pdfviewer id="pdfViewer"
                       [serviceUrl]='service'
                       style="height:640px;display:block"
                       [toolbarSettings]="toolbarSettings">
                </ejs-pdfviewer>
             </div>`,

  providers: [LinkAnnotationService, BookmarkViewService, MagnificationService,
    ThumbnailViewService, ToolbarService, NavigationService,
    AnnotationService, TextSearchService, TextSelectionService,
    PrintService, FormFieldsService, FormDesignerService]
})
export class AppComponent implements OnInit {
  // To utilize the server-backed PDF Viewer, need to specify the service URL. This can be done by including the **[serviceUrl]='service'** attribute within the <ejs-pdfviewer></ejs-pdfviewer> component in app.component.html file.
  //public service = 'https://localhost:44327/pdfviewer';
  
  public toolbarSettings = {
    showTooltip: true,
    toolbarItems: [
      "DownloadOption",
      "UndoRedoTool",
      "PageNavigationTool",
      "MagnificationTool",
      "PanTool",
      "SelectionTool",
      "CommentTool",
      "SubmitForm",
      "SearchOption",
      "AnnotationEditTool",
      "FormDesignerEditTool",
      "PrintOption"
    ]
  };
  ngOnInit(): void {
  }
}