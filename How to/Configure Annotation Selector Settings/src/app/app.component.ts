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
  AnnotationResizerLocation,
  CursorType
} from '@syncfusion/ej2-angular-pdfviewer';

@Component({
  selector: 'app-root',
  // specifies the template string for the PDF Viewer component
  template: `<div class="content-wrapper">
  <ejs-pdfviewer id="pdfViewer"
             [documentPath]='document'
                 [resourceUrl]='resource' 
                 [annotationSelectorSettings]="annotationSelection"
             style="height:640px;display:block">
  </ejs-pdfviewer>
</div>`,
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
    PrintService]
})
export class AppComponent implements OnInit {
  public document = 'https://cdn.syncfusion.com/content/pdf/pdf-succinctly.pdf';
  public resource: string = 'https://cdn.syncfusion.com/ej2/27.1.48/dist/ej2-pdfviewer-lib';
  public annotationSelection = {
    selectionBorderColor: 'blue', 
    resizerBorderColor: 'red', 
    resizerFillColor: '#4070ff', 
    resizerSize: 8, 
    selectionBorderThickness: 1, 
    resizerShape: 'Circle', 
    selectorLineDashArray: [5, 6], 
    resizerLocation: AnnotationResizerLocation.Corners | AnnotationResizerLocation.Edges, 
    resizerCursorType: CursorType.grab 
  };
  ngOnInit(): void {
  }
}