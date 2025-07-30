import { Component, ViewEncapsulation, ViewChild } from '@angular/core';
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
  AddSignatureEventArgs,
  HandWrittenSignatureSettings,
  DisplayMode,
} from '@syncfusion/ej2-angular-pdfviewer';
import { SwitchComponent } from '@syncfusion/ej2-angular-buttons';

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
    FormDesignerService,
    PageOrganizerService,
  ],
  styleUrls: ['app.component.css']
})
export class AppComponent {
  @ViewChild('pdfviewer')
  public pdfviewerControl: PdfViewerComponent | undefined;
  @ViewChild('switch')
  public switch: SwitchComponent | undefined;

  public document: string =
    'https://cdn.syncfusion.com/content/pdf/pdf-succinctly.pdf';
  public resource: string =
    'https://cdn.syncfusion.com/ej2/23.2.6/dist/ej2-pdfviewer-lib';

  // Flag to track if signature has been added
  private signatureAddedFlag: boolean = false;

  ngOnInit(): void {
    // ngOnInit function
  }

  public SignatureAdded(args: AddSignatureEventArgs): void {
    if (this.signatureAddedFlag) {
      this.signatureAddedFlag = false;
      return; // Exit if signature has already been added
    }

    let id = '';
    let proxy = this;
    console.log(args);
    if (id !== args.id) {
      id = args.id;
    }

    if (
      args.type === 'HandWrittenSignature' ||
      args.type === 'SignatureImage'
    ) {
      // Set the flag to true, indicating that a signature is being added
      this.signatureAddedFlag = true;
      var c: any = document.createElement('canvas');
      c.width = 300;
      c.height = 150;
      var ctx = c.getContext('2d');

      // Load the signature image
      var image = new Image();
      image.onload = function () {
        ctx.drawImage(image, 0, 0, 300, 150);
        var date = new Date().toLocaleDateString();
        ctx.font = 'italic 18px Arial';
        ctx.fillStyle = 'blue';
        ctx.fillText(date, 10, 140);
        var imagedata = c.toDataURL('image/png');
        console.log(imagedata);
        var signatureCollections: any =
          proxy.pdfviewerControl?.signatureCollection;
        for (var x = 0; x < signatureCollections.length; x++) {
          if (signatureCollections[x].annotationId === args.id) {
            var left = args.bounds.left;
            var top = args.bounds.top;
            var width = args.bounds.width;
            var height = args.bounds.height;

            signatureCollections[x].signatureType = 'Image';
            signatureCollections[x].value = imagedata;
            proxy.pdfviewerControl?.annotation.deleteAnnotationById(args.id);
            proxy.pdfviewerControl?.annotation.addAnnotation(
              'HandWrittenSignature',
              {
                offset: { x: left, y: top },
                pageNumber: 1,
                width: width,
                height: height,
                signatureItem: ['Signature'],
                signatureDialogSettings: {
                  displayMode: DisplayMode.Upload,
                  hideSaveSignature: false,
                },
                canSave: false,
                path: imagedata,
              } as HandWrittenSignatureSettings
            );
          }
        }
      };
      if (args.data) {
        image.src = args.data; // Set the image source with null check
      } else {
        console.error('Signature data is undefined');
      }
    } else if (args.type === 'SignatureText') {
      this.signatureAddedFlag = true;
      var signatureCollections: any =
        proxy.pdfviewerControl?.signatureCollection;
      for (var x = 0; x < signatureCollections.length; x++) {
        if (signatureCollections[x].annotationId === args.id) {
          const signatureText = args.data;
          const date = new Date().toLocaleDateString();
          const updatedValue = signatureText + '\n' + date;
          signatureCollections[x].signatureType = 'Text';
          signatureCollections[x].value = updatedValue;
          var left = args.bounds.left;
          var top = args.bounds.top;
          var width = args.bounds.width;
          var height = args.bounds.height;
          var canvas: any = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          var ctx = canvas.getContext('2d');
          ctx.font = 'normal 16px Arial';
          ctx.fillStyle = 'black';
          ctx.textAlign = 'left';
          ctx.fillText(signatureText, 10, 30);
          ctx.font = 'italic 14px Arial';
          ctx.fillStyle = 'blue';
          ctx.fillText(date, 10, 60);
          var imageData = canvas.toDataURL('image/png');
          proxy.pdfviewerControl?.annotation.deleteAnnotationById(args.id);
          proxy.pdfviewerControl?.annotation.addAnnotation(
            'HandWrittenSignature',
            {
              offset: { x: left, y: top },
              pageNumber: 1,
              width: width,
              height: height,
              signatureItem: ['Signature'],
              signatureDialogSettings: {
                displayMode: DisplayMode.Upload,
                hideSaveSignature: false,
              },
              canSave: false,
              path: imageData,
            } as HandWrittenSignatureSettings
          );
        }
      }
    } else {
      id = '';
    }
  }
}