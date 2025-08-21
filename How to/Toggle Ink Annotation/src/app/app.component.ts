import { Component, OnInit, ViewChild } from "@angular/core";
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
  PrintService,
  FormFieldsService,
  FormDesignerService,
  PdfViewerComponent,
} from "@syncfusion/ej2-angular-pdfviewer";

@Component({
  selector: "app-root",
  // specifies the template string for the PDF Viewer component
  template: `
  <!-- Button to toggle Ink annotation mode -->
  <button (click)="ToggleInkAnnotation()">Toggle Ink Annotation</button>
  <div class="content-wrapper">
    <ejs-pdfviewer
      #pdfviewer
      id="pdfViewer"
      [resourceUrl]="resource"
      [documentPath]="document"
      style="height:640px;display:block"
    ></ejs-pdfviewer>
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
    PrintService,
    FormFieldsService,
    FormDesignerService,
  ],
})
export class AppComponent implements OnInit {
  @ViewChild("pdfviewer") 
  public pdfviewerControl: PdfViewerComponent | undefined;
  public isAnnotationAdded: boolean = true;
  public resource = "https://cdn.syncfusion.com/ej2/30.1.37/dist/ej2-pdfviewer-lib";
  public document = "https://cdn.syncfusion.com/content/pdf/pdf-succinctly.pdf";
  ngOnInit(): void {}

  // Method to toggle Ink annotation mode on and off
 ToggleInkAnnotation() {
  if(this.pdfviewerControl){
        if(this.isAnnotationAdded){
          // Enable Ink annotation mode
            this.pdfviewerControl.annotationModule.setAnnotationMode("Ink");
            this.isAnnotationAdded = false;
        }
        else{
          // Disable annotation mode
            this.pdfviewerControl.annotationModule.setAnnotationMode("None");
            this.isAnnotationAdded = true;
        }
    }
  }
}