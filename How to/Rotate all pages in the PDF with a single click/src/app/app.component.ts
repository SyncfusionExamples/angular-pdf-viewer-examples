import { Component, ViewEncapsulation, OnInit, ViewChild } from '@angular/core';
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
  FormDesignerService,
  PageOrganizerService,
  PdfViewerModule,
} from '@syncfusion/ej2-angular-pdfviewer';
import { SwitchComponent, SwitchModule } from '@syncfusion/ej2-angular-buttons';
import { ClickEventArgs } from '@syncfusion/ej2-buttons';
import { CustomToolbarItemModel } from '@syncfusion/ej2-pdfviewer';
import {
    PdfDocument,
    PdfPage,
    PdfRotationAngle,
  } from '@syncfusion/ej2-pdf';
  
/**
 * Default PdfViewer Controller
 */
@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  encapsulation: ViewEncapsulation.None,
  // tslint:disable-next-line:max-line-length
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
    PageOrganizerService,
  ],
  styleUrls: ['app.component.css'],
  standalone: true,
  imports: [SwitchModule, PdfViewerModule],
})
export class AppComponent {
  @ViewChild('pdfviewer')
  public pdfviewerControl: PdfViewerComponent | undefined;
  public currentPageNumber: number | undefined;

  public document: string =
    'https://cdn.syncfusion.com/content/pdf/pdf-succinctly.pdf';
  public resource: string =
    'https://cdn.syncfusion.com/ej2/23.2.6/dist/ej2-pdfviewer-lib';
  ngOnInit(): void {
    // ngOnInit function
  }
  public change(e: any): void {
    if(this.pdfviewerControl){
    if (e.checked) {
      this.pdfviewerControl.serviceUrl = '';
    } else {
      this.pdfviewerControl.serviceUrl =
        'https://services.syncfusion.com/angular/production/api/pdfviewer';
    }
    this.pdfviewerControl.dataBind();
    this.pdfviewerControl.load(this.pdfviewerControl.documentPath, "");
  }
}
// Custom toolbar item for rotating pages counterclockwise
  public toolItem1: CustomToolbarItemModel = {
    prefixIcon: 'e-icons e-transform-left',
    id: 'rotateCounterclockwise',
    tooltipText: 'Custom toolbar item',
  };
  // Custom toolbar item for rotating pages clockwise
  public toolItem2: CustomToolbarItemModel = { 
    prefixIcon: 'e-icons e-transform-right',
    id: 'rotateClockwise',
    tooltipText: 'Custom toolbar item',
  };
  // Toolbar configuration including custom rotation buttons  
  public toolbarSettings = {
    showTooltip: true,
    toolbarItems: [
      this.toolItem1,
      this.toolItem2,
      'OpenOption',
      'PageNavigationTool',
      'MagnificationTool',
      'PanTool',
      'SelectionTool',
      'SearchOption',
      'PrintOption',
      'DownloadOption',
      'UndoRedoTool',
      'AnnotationEditTool',
      'FormDesignerEditTool',
      'CommentTool',
      'SubmitForm',
    ],
  };
  public toolbarClick(args: any): void {
    var pdfViewer = (<any>document.getElementById('pdfViewer'))
      .ej2_instances[0];
      var _this = this;
      // Rotate all pages clockwise
    if (args.item && args.item.id === 'rotateClockwise') {
      this.currentPageNumber = pdfViewer.currentPageNumber - 1;
      pdfViewer.saveAsBlob().then(function (value: Blob) {
        var reader = new FileReader();
        reader.readAsDataURL(value);
        reader.onload = () => {
          var base64 = (reader.result as any).split('base64,')[1];
          let pdfDocument = new PdfDocument(base64);
          for(var i=0; i<pdfViewer.pageCount; i++){
            let page = pdfDocument.getPage(i) as PdfPage;
            var rotation = page.rotation + 1;
            if(rotation > 4){ 
              rotation = 0;
            }
            page.rotation = _this.getPdfRotationAngle(rotation);
          }
          pdfDocument.saveAsBlob().then((value) => {
            var reader = new FileReader();
            reader.readAsDataURL(value.blobData);
            reader.onload = () => {
              var base64data = reader.result; 
              pdfViewer.load(base64data);
            }; 
          });
        };
      });
    }
    // Rotate all pages counterclockwise 
    else if (args.item && args.item.id === 'rotateCounterclockwise') {
      this.currentPageNumber = pdfViewer.currentPageNumber - 1;
      pdfViewer.saveAsBlob().then(function (value: Blob) {
        var reader = new FileReader();
        reader.readAsDataURL(value);
        reader.onload = () => {
          var base64 = (reader.result as any).split('base64,')[1];
          let pdfDocument = new PdfDocument(base64);
          for(var i=0; i<pdfViewer.pageCount; i++){
            let page = pdfDocument.getPage(i) as PdfPage;
            var rotation = page.rotation - 1;
            if(rotation < 0){ 
              rotation = 3;
            }
            page.rotation = _this.getPdfRotationAngle(rotation);
          }
          pdfDocument.saveAsBlob().then((value) => {
            var reader = new FileReader();
            reader.readAsDataURL(value.blobData);
            reader.onload = () => {
              var base64data = reader.result; 
              pdfViewer.load(base64data);
            }; 
          });
        };
      });
    }
  }
  //Converts numeric rotation value to PdfRotationAngle enum.
  private getPdfRotationAngle(rotation: number): PdfRotationAngle {
        switch (rotation) {
            case 0:
                return PdfRotationAngle.angle0;
            case 1:
                return PdfRotationAngle.angle90;
            case 2:
                return PdfRotationAngle.angle180;
            case 3:
                return PdfRotationAngle.angle270;
            default:
                return PdfRotationAngle.angle0;
        }
    }
}
