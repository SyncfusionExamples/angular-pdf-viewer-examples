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
  FormDesignerService
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
    FormDesignerService
  ],
})
export class AppComponent {
  public service: string = 'https://localhost:5001/pdfviewer';
  //Sets the document path of the PDF Viewer.  
  public document: string = 'https://cdn.syncfusion.com/content/pdf/pdf-succinctly.pdf';
  ngOnInit(): void {
  }
  //Method to check the comments added in the PDF document.
  CheckComments(){
    var pdfviewer = (<any>document.getElementById("pdfViewer")).ej2_instances[0];
    var annotationCollections= pdfviewer.annotationCollection;
    for(var x=0;x<annotationCollections.length;x++){
        console.log(annotationCollections[x].annotationId);
        var comments = annotationCollections[x].comments;
        for(var y=0;y<comments.length;y++){
            var comment = comments[y]; 
            console.log("comment"+ "[" + y + "] :"+ comment.note);
        }
        var note = annotationCollections[x].note;
        console.log("note : " + note);
    }
}
}
