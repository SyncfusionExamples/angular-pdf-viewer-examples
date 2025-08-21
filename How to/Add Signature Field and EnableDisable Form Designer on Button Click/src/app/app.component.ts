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
  SignatureFieldSettings,
} from "@syncfusion/ej2-angular-pdfviewer";

@Component({
  selector: "app-root",
  // specifies the template string for the PDF Viewer component
  template: `
  <!-- Button to add a signature field -->
  <button (click)="addSignatureField()">addSignature</button>
  <!-- Toggle button to enable/disable form designer mode -->
  <button (click)="toggleDesignerMode()">
      {{ pdfviewerControl?.designerMode ? 'Disable' : 'Enable' }} Form Designer
  </button>
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
  @ViewChild("pdfviewer") public pdfviewerControl: PdfViewerComponent | undefined;
  public resource = "https://cdn.syncfusion.com/ej2/30.1.37/dist/ej2-pdfviewer-lib";
  public document = "https://cdn.syncfusion.com/content/pdf/pdf-succinctly.pdf";
  ngOnInit(): void {}

  //Toggles the form designer mode on/off
  public toggleDesignerMode(): void {
    if (this.pdfviewerControl) {
      this.pdfviewerControl.designerMode = !this.pdfviewerControl.designerMode;
    }
  }

  //Adds a signature field to the first page and enables designer mode
  public addSignatureField(): void {
    if (this.pdfviewerControl?.formDesignerModule) {
      this.pdfviewerControl.formDesignerModule.addFormField('SignatureField', {
        name: 'SignatureField1',
        bounds: { X: 100, Y: 100, Width: 200, Height: 100 },
        pageNumber: 1,
        isReadOnly: false,
      } as SignatureFieldSettings);
      // Automatically enable designer mode after adding the field
      this.pdfviewerControl.designerMode = true;
    }
  }

}