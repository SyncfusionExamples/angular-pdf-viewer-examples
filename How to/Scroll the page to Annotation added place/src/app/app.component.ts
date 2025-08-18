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
  HighlightSettings,
} from "@syncfusion/ej2-angular-pdfviewer";

@Component({
  selector: "app-root",
  // specifies the template string for the PDF Viewer component
  template: `<button id="addAnnotations" (click)="addAnnotations()">Add Annotations</button>
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
  @ViewChild('pdfviewer')
  public pdfviewerControl: PdfViewerComponent | undefined;
  public resource = "https://cdn.syncfusion.com/ej2/30.1.37/dist/ej2-pdfviewer-lib";
  public document = "https://cdn.syncfusion.com/content/pdf/pdf-succinctly.pdf";
  ngOnInit(): void {}
  // This method is used to add annotations to the PDF document
  public addAnnotations(): void {
    if (this.pdfviewerControl) {
      var targetPage = 1;
      this.location.forEach((locationDimensions) => {
        const dimensions = locationDimensions.map((val) => val);
        const x = dimensions[1];
        const y = dimensions[2];
        //calculate height and width properly with coordinates
        const height = dimensions[4] - dimensions[2];
        const width = dimensions[3] - dimensions[1];
        //add highlight annotation
        this.pdfviewerControl?.annotation?.addAnnotation('Highlight', {
          bounds: [
            {
              //convert points to pixels
              x: (x * 96) / 72,
              y: (y * 96) / 72,
              width: (width * 96) / 72,
              height: (height * 96) / 72,
            },
          ],
          pageNumber: targetPage,
        } as HighlightSettings);
      });
      this.pdfviewerControl.navigationModule.goToPage(targetPage);
      //get the bounds of required annotation to scrollTo
      var bounds =
        this.pdfviewerControl.annotationCollection[
          this.pdfviewerControl.annotationCollection.length - 1
        ].bounds[0];
      // Create a proper Point instance instead of plain object
      var pagePoint: any = { x: bounds.X, y: bounds.Y };
      var clientPoint = this.pdfviewerControl.convertPagePointToClientPoint(pagePoint,targetPage);
      const container = this.pdfviewerControl.viewerBase.viewerContainer;
      const containerHeight = container.clientHeight;
      const containerWidth = container.clientWidth;
      const zoomFactor = this.pdfviewerControl.zoomPercentage / 100;
      const targetY = clientPoint.y * zoomFactor - containerHeight / 2;
      const targetX = clientPoint.x * zoomFactor - containerWidth / 2;

      container.scrollTo(Math.max(0, targetX), Math.max(0, targetY));
    }
  }
  // This is the location array that contains the coordinates for the annotations
  public location = [
    [
      1,

      184.32,

      577.4616943,

      540.2658592,

      586.5827942999999,
    ],

    [
      1,

      198.48,

      588.2619888099999,

      551.6033865000002,

      597.3830888099999,
    ],

    [
      1,

      198.48,

      599.0622833199999,

      544.2152954999999,

      608.1833833199998,
    ],

    [
      1,

      198.48,

      609.8625778299999,

      227.74048879999998,

      618.9836778299998,
    ],
  ];
}