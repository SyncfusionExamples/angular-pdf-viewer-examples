import { Component, OnInit } from '@angular/core';
import { PdfViewerModule, LinkAnnotationService, BookmarkViewService,
         MagnificationService, ThumbnailViewService, ToolbarService,
         NavigationService, TextSearchService, TextSelectionService,
         PrintService, FormDesignerService, FormFieldsService, 
         AnnotationService, PageOrganizerService, AnnotationResizerLocation, CursorType, DisplayMode, FormFieldDataFormat, LoadEventArgs } from '@syncfusion/ej2-angular-pdfviewer';

@Component({
  selector: 'app-root',
  // specifies the template string for the PDF Viewer component
  template: `
              <button (click)="OnExportJson()">Export Json</button>
              <button (click)="OnImportJson()">Import Json</button>
              <div class="content-wrapper">
                <ejs-pdfviewer id="pdfViewer"
                    [documentPath]='document'
                    [resourceUrl]='resource' 
                    [isSignatureEditable]="true"
                    [handWrittenSignatureSettings]="handWritten"
                    (documentLoad)='documentLoad($event)'
                    style="height:640px;display:block">
                </ejs-pdfviewer>
             </div>`,
  providers: [ LinkAnnotationService, BookmarkViewService, MagnificationService,
               ThumbnailViewService, ToolbarService, NavigationService,
               TextSearchService, TextSelectionService, PrintService,
               AnnotationService, FormDesignerService, FormFieldsService, PageOrganizerService]
})
export class AppComponent implements OnInit {
  public handWritten = {
    signatureItem: ["Signature", "Initial"],
    saveSignatureLimit: 1,
    author: "Syncfusion", //This line is nessacery to consider Handwritten signature as ink annotation. This helps to Export and Import Handwritten Signature annotation.
    saveInitialLimit: 1,
    opacity: 1,
    strokeColor: "#000000",
    width: 150,
    height: 100,
    thickness: 1,
    annotationSelectorSettings: {
      selectionBorderColor: "blue",
      resizerBorderColor: "black",
      resizerFillColor: "#FF4081",
      resizerSize: 8,
      selectionBorderThickness: 1,
      resizerShape: "Circle",
      selectorLineDashArray: [5, 6],
      resizerLocation:
        AnnotationResizerLocation.Corners | AnnotationResizerLocation.Edges,
      resizerCursorType: CursorType.grab,
    },
    allowedInteractions: ["Resize"],
    signatureDialogSettings: {
      displayMode: DisplayMode.Draw | DisplayMode.Text | DisplayMode.Upload,
      hideSaveSignature: false,
    },
    initialDialogSettings: {
      displayMode: DisplayMode.Draw | DisplayMode.Text | DisplayMode.Upload,
      hideSaveSignature: false,
    },
  };
  public document: string = 'https://cdn.syncfusion.com/content/pdf/handwritten-signature.pdf';
  public resource: string = "https://cdn.syncfusion.com/ej2/28.1.33/dist/ej2-pdfviewer-lib";
  public isInitialLoading: boolean = true;
  public exportedData:any;
  exportObject: any;
  ngOnInit(): void {
  }
  OnExportJson() {
    var viewer = (<any>document.getElementById('pdfViewer')).ej2_instances[0];
    viewer.exportAnnotationsAsObject().then( (value: any) => {
      this.exportObject = value;
    });
    console.log(this.exportedData);
  }
  public documentLoad(e: LoadEventArgs): void {
    if(this.isInitialLoading){
      var viewer = (<any>document.getElementById('pdfViewer')).ej2_instances[0];
      viewer.annotationModule.setAnnotationMode('HandWrittenSignature');
      this.isInitialLoading = false;
    }
}
  OnImportJson() {
    var viewer = (<any>document.getElementById('pdfViewer')).ej2_instances[0];
    viewer.importAnnotation(JSON.parse(this.exportObject));
  }
}