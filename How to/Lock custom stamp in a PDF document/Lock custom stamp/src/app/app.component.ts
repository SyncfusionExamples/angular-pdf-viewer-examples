import { Component, ViewEncapsulation, OnInit } from '@angular/core';
import {
  PdfViewerComponent,
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
} from '@syncfusion/ej2-angular-pdfviewer';

/**
 * Default PdfViewer Controller
 */
@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
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
  ],
})
export class AppComponent {
  public service: string =
    'https://localhost:5001/pdfviewer';
  public document: string = 'PDF_Succinctly_CustomStamp.pdf';
  ngOnInit(): void {
  }
  //Method to lock the custom stamp annotation
  public fireAjaxRequestSuccess(event:any, data:any) {
    debugger;
    if (event.action == 'RenderAnnotationComments') {
      for (var i = data.startPageIndex; i < data.endPageIndex; i++) {
        for (
          var j = 0;
          j < data.annotationDetails[i].stampAnnotations.length;
          j++
        ) {
          //Subject becomes null only for custom stamps
          if (data.annotationDetails[i].stampAnnotations[j].Subject == null) {
            //Iterated the annotations and checked if subject is null then set islocked as true
            data.annotationDetails[i].stampAnnotations[j].IsLocked = true;
          }
        }
      }
    }
  }
}
