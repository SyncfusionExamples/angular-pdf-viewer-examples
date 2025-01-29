import { Component, OnInit, ViewChild } from '@angular/core';
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
  LoadEventArgs,
  TextFieldSettings
} from '@syncfusion/ej2-angular-pdfviewer';

// Component Decorator to define metadata for the component
@Component({
  selector: 'app-root', // Selector used in HTML to reference this component
  // Inline HTML template for the component
  template: `
    <div class="content-wrapper">
      <div style="margin-top: 20px;"></div>
      <ejs-pdfviewer #pdfViewer
        id="pdfViewer"
        [documentPath]='document'
        (documentLoad)="documentLoaded($event)"
        [resourceUrl]='resource' 
        style="height:640px;display:block">
      </ejs-pdfviewer>
    </div>
  `,
  // Services provided by the component for PDF manipulation
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
  // PDF document URL
  public document: string = 'https://cdn.syncfusion.com/content/pdf/form-designer.pdf';
  // Resource URL for PDF Viewer
  public resource: string = 'https://cdn.syncfusion.com/ej2/28.1.33/dist/ej2-pdfviewer-lib';

  ngOnInit(): void {
    // Init function - you can introduce initialization logic here
  }

  // Triggered when the document is loaded
  public documentLoaded(e: LoadEventArgs): void {
    // Fetch the PDF viewer instance
    const pdfviewer = (<any>document.getElementById("pdfViewer")).ej2_instances[0];
    
    // Check the loaded document name
    if (e.documentName === 'form-designer.pdf') {
      // Add a form field to the PDF
      pdfviewer.formDesignerModule.addFormField("Textbox", {
        name: "First Name",
        bounds: { X: 146, Y: 229, Width: 150, Height: 24 },
        tooltip: '<a href="loaded">Google</a>'
      } as TextFieldSettings);
    }
  
    // Obtain the form field element
    const formField = document.getElementsByClassName("e-pv-formfield-input")[0];
    
    // Add mouseover event listener to the form field
    formField.addEventListener("mouseover", () => {
      // Obtain the tooltip element
      const tooltip = document.getElementsByClassName("e-tooltip-wrap")[0];
      
      // Add click event listener on the tooltip
      tooltip.addEventListener("click", () => {
        alert("Hyperlink clicked in the tooltip!");
      });
    });
  }
}