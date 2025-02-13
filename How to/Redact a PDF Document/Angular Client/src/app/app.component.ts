import {
  Component,
  ViewEncapsulation,
  OnInit,
  ViewChild,
  Inject,
} from '@angular/core';
import {
  PdfViewerComponent,
  LinkAnnotationService,
  BookmarkViewService,
  MagnificationService,
  ToolbarService,
  NavigationService,
  TextSelectionService,
  PrintService,
  DynamicStampItem,
  SignStampItem,
  StandardBusinessStampItem,
  PageChangeEventArgs,
  LoadEventArgs,
  AnnotationService,
  FormDesignerService,
  PageOrganizerService,
  TextSearchService,
  TextSelection,
  PdfViewerModule,
  AnnotationAddEventArgs,
  AnnotationRemoveEventArgs,
  PdfViewer,
  CreateArgs,
} from '@syncfusion/ej2-angular-pdfviewer';
import {
  ToolbarComponent,
  MenuItemModel,
  ToolbarModule,
  MenuModule,
  AppBar,
  AppBarModule,
  ChangeEventArgs,
} from '@syncfusion/ej2-angular-navigations';
import {
  AnimationSettingsModel,
  Dialog,
  DialogComponent,
  DialogModule,
} from '@syncfusion/ej2-angular-popups';
import { ClickEventArgs } from '@syncfusion/ej2-buttons';
import {
  ButtonComponent,
  ButtonModule,
  SwitchComponent,
  SwitchModule,
} from '@syncfusion/ej2-angular-buttons';

import { ComboBoxModule } from '@syncfusion/ej2-angular-dropdowns';
import {
  RemovingEventArgs,
  UploaderComponent,
  UploaderModule,
} from '@syncfusion/ej2-angular-inputs';
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
    TextSearchService,
    TextSelectionService,
    MagnificationService,
    ToolbarService,
    NavigationService,
    TextSelectionService,
    PrintService,
    AnnotationService,
    FormDesignerService,
    PageOrganizerService,
  ],
  styleUrls: ['app.component.css'],
  standalone: true,
  imports: [
    SwitchModule,
    AppBarModule,
    ToolbarModule,
    MenuModule,
    PdfViewerModule,

    ButtonModule,
    DialogModule,
    UploaderModule,
    ComboBoxModule,
  ],
})
export class AppComponent {
  @ViewChild('pdfviewer')
  public pdfviewerControl: PdfViewerComponent | undefined;

  @ViewChild('primaryToolbar')
  public primaryToolbar: ToolbarComponent | undefined;

  @ViewChild('secondaryToolbar')
  public secondaryToolbar: ToolbarComponent | undefined;

  @ViewChild('defaultButtonDownload') downloadBtn: ButtonComponent | undefined;

  @ViewChild('dialogComponent')
  public dialog: DialogComponent | undefined;

  @ViewChild('cancelButton')
  public cancelButton: ButtonComponent | undefined;
  public showCloseIcon: Boolean = true;
  public target = '#e-pv-redact-sb-panel';
  public width = '477px';
  public visible: Boolean = false;
  public isModal: Boolean = true;

  @ViewChild('defaultupload')
  public uploadObj: UploaderComponent | undefined;
  public path: Object = {
    saveUrl:
      'https://services.syncfusion.com/angular/production/api/FileUploader/Save',
    removeUrl:
      'https://services.syncfusion.com/angular/production/api/FileUploader/Remove',
  };
  public dropElement: HTMLElement = document.getElementsByClassName(
    'drop-area-wrap'
  )[0] as HTMLElement;
  public allowedExtensions = '.png, .jpg, .jpeg';
  public imageSrc: any;

  public onFileChange(args: any): void {
    var file = args.file[0].rawFile;
    let imageElement = document.getElementById('imageView');
    let imageElementContainer = document.getElementById('imageContainer');
    let base64String: any;
    var reader = new FileReader();
    reader.onload = (e) => {
      base64String = e.target?.result as string;
      this.imageSrc = base64String;
      this.customStampSource = this.imageSrc;
      (imageElement as any).src = this.imageSrc;
      if(imageElementContainer)
      imageElementContainer.className =
        'image-container e-pv-redact-sb-image-container-selected';
      (imageElement as any).style.display = 'block';
      // Bind click event to the image element
      if(imageElement)
      imageElement.addEventListener('click', this.handleImageClick.bind(this));
    };
    reader.readAsDataURL(file);
  }

  public handleImageClick() {
    this.customStampSource = this.imageSrc;
    if(this.dialog)
    this.dialog.hide();
    this.addImage();
  }

  public ngAfterViewInit(): void {
    if(this.downloadBtn)
    this.downloadBtn.element.setAttribute('aria-label', 'menu');
  }

  public document: string =
    'https://cdn.syncfusion.com/content/pdf/programmatical-annotations.pdf';
  public service: string = 'https://localhost:44309/pdfviewer';

  //zoom value
  public data: string[] = ['10%', '25%', '50%', '75%', '100%', '200%', '400%'];
  ngOnInit(): void {
    
      const fileUploadElement = document.getElementById('fileUpload');
    if(fileUploadElement)
    fileUploadElement.addEventListener('change', this.readFile.bind(this));
    
  }

  public annotation: any;
  public redactionCount: number = 0;
  public fileName: string = 'programmatical-annotations.pdf';
  //Updating the number of redaction while the annotation has been added
  annotationAdd = (e: AnnotationAddEventArgs): void => {
    var pdfAnnotationList = new Array();
    if(this.pdfviewerControl)
    pdfAnnotationList = this.pdfviewerControl.annotationCollection;
    var selectedAnnotationIndex = pdfAnnotationList.findIndex(
      (item) => item.annotationId == e.annotationId
    );
    if (selectedAnnotationIndex != -1) {
      this.annotation = pdfAnnotationList[selectedAnnotationIndex];
    }
    if (
      this.annotation.author == 'Redaction' ||
      this.annotation.customStampName == 'Image' ||
      this.annotation.author == 'Pattern' ||
      this.annotation.author == 'Text'
    ) {
      this.redactionCount = this.redactionCount + 1;
      this.updateRedaction();
    }
  };
  //Updating the number of redaction while the annotation has been removed
  annotationRemove = (e: AnnotationRemoveEventArgs): void => {
    if (
      this.annotation.author == 'Redaction' ||
      this.annotation.customStampName == 'Image' ||
      this.annotation.author == 'Pattern' ||
      this.annotation.author == 'Text'
    ) {
      this.redactionCount = this.redactionCount - 1;
      this.updateRedaction();
    }
  };

  //To enable the redaction button based on count
  public updateRedaction(): void {
    if(this.primaryToolbar)
    if (this.redactionCount <= 0) {
      this.primaryToolbar.items[8].disabled = true;
    } else {
      this.primaryToolbar.items[8].disabled = false;
    }
  }

  //to read the file
  // tslint:disable-next-line
  private readFile(args: any): void {
    // tslint:disable-next-line
    let upoadedFiles: any = args.target.files;
    if (args.target.files[0] !== null) {
      let uploadedFile: File = upoadedFiles[0];
      this.fileName = upoadedFiles[0].name;
      if (uploadedFile) {
        let reader: FileReader = new FileReader();
        reader.readAsDataURL(uploadedFile);
        // tslint:disable-next-line
        let proxy: any = this;
        // tslint:disable-next-line
        reader.onload = (e: any): void => {
          let uploadedFileUrl: string = e.currentTarget.result;
          proxy.pdfviewerControl.documentPath = uploadedFileUrl;
          proxy.pdfviewerControl.fileName = proxy.fileName;
          proxy.pdfviewerControl.downloadFileName = proxy.fileName;
        };
      }
    }
  }

  //To open a file from viewer
  public openDocumentClicked(e: ClickEventArgs): void {
    const fileUploadElement = document.getElementById('fileUpload');
    if(fileUploadElement)
    fileUploadElement.click();
  }

  //when the image button is clicked
  public imageDialog = (): void => {
    if(this.dialog)
    this.dialog.show();
  };

  //when cancel button clicked
  public closeDialog(e: ClickEventArgs|MouseEvent): void {
    if(this.dialog)
    this.dialog.hide();
  }

  //Method to create rectangle annotation when "Text" button is clicked
  public addText(e: ClickEventArgs): void {
    if(this.pdfviewerControl)
    this.pdfviewerControl.rectangleSettings = {
      fillColor: '#a3a2a0',
      strokeColor: '#a3a2a0',
      author: 'Text',
    };
    if(this.pdfviewerControl)
    this.pdfviewerControl.annotation.setAnnotationMode('Rectangle');
  }

  public customStampSource: any = '';
  //Adding the image to the pdf
  public addImage(): void {
    if(this.pdfviewerControl){
    this.pdfviewerControl.stampSettings.author = 'Image';
    this.pdfviewerControl.customStampSettings = {
      width: 200,
      author: 'Image',
      height: 125,
      isAddToMenu: false,
      enableCustomStamp: false,
    };
    this.pdfviewerControl.customStamp = [
      {
        customStampName: 'Image',
        customStampImageSource: this.customStampSource,
      },
    ];
  }
}

  //Method to create rectangle annotation when the "Pattern" button is clicked
  public addPattern(e: ClickEventArgs): void {
    if(this.pdfviewerControl){
    this.pdfviewerControl.rectangleSettings = {
      fillColor: '#dedfe0',
      strokeColor: '#dedfe0',
      author: 'Pattern',
    };
    this.pdfviewerControl.annotation.setAnnotationMode('Rectangle');
  }
}

  //Method to create rectangle annotation when the "Blackout" button is clicked
  public addBlackout(e: ClickEventArgs): void {
    if(this.pdfviewerControl){
    this.pdfviewerControl.rectangleSettings = {
      fillColor: '#000000',
      strokeColor: '#000000',
      author: 'Redaction',
    };
    this.pdfviewerControl.annotation.setAnnotationMode('Rectangle');
  }
}

  //Method to create rectangle annotation when the "Whiteout" button is clicked
  public addWhiteout(e: ClickEventArgs): void {
    if(this.pdfviewerControl){
    this.pdfviewerControl.rectangleSettings = {
      fillColor: '#ffffff',
      strokeColor: '#ffffff',
      author: 'Redaction',
    };
    this.pdfviewerControl.annotation.setAnnotationMode('Rectangle');
  }
}
  //To download the redacted pdf
  public download(e: ClickEventArgs|MouseEvent): void {
    if(this.pdfviewerControl){
    this.pdfviewerControl.fileName = this.fileName;
    this.pdfviewerControl.downloadFileName = this.fileName;
    this.pdfviewerControl.serverActionSettings.download = 'Redaction';
    this.pdfviewerControl.download();
    this.pdfviewerControl.serverActionSettings.download = 'Download';
  }
}

  //Method for moving to previous page
  public previousClicked(e: ClickEventArgs): void {
    if(this.pdfviewerControl)
    this.pdfviewerControl.navigation.goToPreviousPage();
  }

  //Method for moving to next page
  public nextClicked(e: ClickEventArgs): void {
    if(this.pdfviewerControl)
    this.pdfviewerControl.navigation.goToNextPage();
  }

  //to get current page
  public pageChanged(e: PageChangeEventArgs): void {
    if(this.pdfviewerControl)
    (
      document.getElementById('e-pv-redact-sb-currentPage') as HTMLSpanElement
    ).textContent = this.pdfviewerControl.currentPageNumber.toString() + ' ';
    this.updatePageNavigation();
  }

  public onLoad(e: CreateArgs) {
    (
      document.getElementById('e-pv-redact-sb-drop-area-wrap') as HTMLDivElement
    ).style.display = 'flex';
    (
      document.getElementById('e-pv-redact-sb-appbar') as HTMLDivElement
    ).style.display = 'block';
  }

  //while loading document
  public documentLoaded(e: LoadEventArgs): void {
    if(this.pdfviewerControl){
     const sbtotalPage = document.getElementById('e-pv-redact-sb-totalPage');
     if(sbtotalPage)
      sbtotalPage.textContent =
      '/ ' + this.pdfviewerControl.pageCount;
    (
      document.getElementById('e-pv-redact-sb-currentPage') as HTMLSpanElement
    ).textContent = this.pdfviewerControl.currentPageNumber.toString() + ' ';
    this.updatePageNavigation();
    this.updateRedaction();
  }
}

  //Zoom values changes when the percentage is selected from the dropdown
  public zoom: any;
  public previousZoom: any;
  public zoomValueChange(e: ChangeEventArgs) {
    if(this.pdfviewerControl){
    this.zoom = (e as any).value;
    this.previousZoom = (e as any).previousItemData.value;
    if (this.zoom !== null || this.previousZoom !== null) {
      var zoomchange = parseInt(this.zoom.replace('%', ''), 10);
      this.pdfviewerControl.magnificationModule.zoomTo(zoomchange);
    }
  }
}

  //Updating the navigation button based on the page number either "enabled" or "disabled"
  private updatePageNavigation(): void {
    if(this.pdfviewerControl && this.secondaryToolbar)
    if (this.pdfviewerControl.currentPageNumber === 1) {
      this.secondaryToolbar.items[0].disabled = true;
      this.secondaryToolbar.items[2].disabled = false;
    } else if (
      this.pdfviewerControl.currentPageNumber ===
      this.pdfviewerControl.pageCount
    ) {
      this.secondaryToolbar.items[0].disabled = false;
      this.secondaryToolbar.items[2].disabled = true;
    } else {
      this.secondaryToolbar.items[0].disabled = false;
      this.secondaryToolbar.items[2].disabled = false;
    }
  }

  //To redact the pdf in server side using the button click event
  public redaction(): void {
    if(this.pdfviewerControl){
    this.pdfviewerControl.serverActionSettings.download = 'Redaction';
    let data: any;
    let base64data: any;
    this.pdfviewerControl.saveAsBlob().then((value) => {
      data = value;
      var reader = new FileReader();
      reader.readAsDataURL(data);
      reader.onload = () => {
        base64data = reader.result;
        if(this.pdfviewerControl)
        this.pdfviewerControl.load(base64data, '');
      };
    });
    this.redactionCount = 0;
    this.updateRedaction();
    this.pdfviewerControl.serverActionSettings.download = 'Download';
  }
}
}
