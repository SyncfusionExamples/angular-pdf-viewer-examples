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
import {
  ToastComponent,
  ToastCloseArgs,
  ToastPositionModel,
  ToastModule,
} from '@syncfusion/ej2-angular-notifications';
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
  imports: [SwitchModule, PdfViewerModule, ToastModule],
})
export class AppComponent {
  @ViewChild('pdfviewer')
  public pdfviewerControl: PdfViewerComponent | undefined;
  @ViewChild('switch')
  public switch: SwitchComponent | undefined;
  // Access the Toast component instance
  @ViewChild('defaulttoast')
  public toastObj: ToastComponent | undefined;
  // Position configuration for toast notifications
  public position: ToastPositionModel = { X: 'Right' };
  // Toast messages for download start and end
  public toasts: { [key: string]: Object }[] = [
    { title: 'Information!', content: 'Document is under downloading.', cssClass: 'e-toast-info', icon: 'e-info toast-icons' },
    { title: 'Success!', content: 'Document downloaded successfully.', cssClass: 'e-toast-success', icon: 'e-success toast-icons' },
];

// PDF document path and resource URL
  public document: string =
    'https://cdn.syncfusion.com/content/pdf/pdf-succinctly.pdf';
  public resource: string =
    'https://cdn.syncfusion.com/ej2/23.2.6/dist/ej2-pdfviewer-lib';
  ngOnInit(): void {
    // ngOnInit function
  }

  public downloadStart(args: any) {
    if(this.toastObj)
    this.toastObj.show(this.toasts[0]);
    console.log(args);
  }
  //Triggered when PDF download starts. Shows an informational toast.
  public downloadEnd(args: any) {
    console.log(args);
    if(this.toastObj){
    this.toastObj.hide('All');
    this.toastObj.show(this.toasts[1]);
    }
  }
  //Triggered when PDF download ends. Shows a success toast.
  public onClose = (e: ToastCloseArgs): void => {};
  //Optional handler before toast opens.
  public onBeforeOpen = (): void => {};
}
