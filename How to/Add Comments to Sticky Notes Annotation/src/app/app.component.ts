import { Component, ViewEncapsulation, OnInit,ViewChild} from '@angular/core';
import { PdfViewerComponent, LinkAnnotationService, BookmarkViewService, MagnificationService, ThumbnailViewService, ToolbarService, NavigationService, TextSearchService, TextSelectionService, PrintService, AnnotationService, FormFieldsService, FormDesignerService, PageOrganizerService,PdfViewerModule, TextSelectionStartEventArgs, AnnotationSelectEventArgs, StickyNotesSettings } from '@syncfusion/ej2-angular-pdfviewer';
import { SwitchComponent, SwitchModule } from '@syncfusion/ej2-angular-buttons';
import { ClickEventArgs } from '@syncfusion/ej2-buttons';



/**
 * Default PdfViewer Controller
 */
@Component({
    selector: 'app-root',
    templateUrl: 'app.component.html',
    encapsulation: ViewEncapsulation.None,
    // tslint:disable-next-line:max-line-length
    providers: [LinkAnnotationService, BookmarkViewService, MagnificationService, ThumbnailViewService, ToolbarService, NavigationService,
        TextSearchService, TextSelectionService, PrintService, AnnotationService, FormFieldsService, FormDesignerService,PageOrganizerService],
    styleUrls: ['app.component.css'],
    standalone: true,
    imports: [
        
        SwitchModule,
        PdfViewerModule,
        
    ],
})

export class AppComponent {
    @ViewChild('pdfviewer')
    public pdfviewer: PdfViewerComponent | undefined;
    
    // PDF document and resource URLs
  public document: string = 'https://cdn.syncfusion.com/content/pdf/pdf-succinctly.pdf';
  public resource: string = 'https://cdn.syncfusion.com/ej2/31.1.17/dist/ej2-pdfviewer-lib';

    ngOnInit(): void {
        // ngOnInit function
    }
    public annotationAdded = true;

  // Add Sticky Note annotation when the document is loaded
  documentLoad() {
    this.pdfviewer?.annotation.addAnnotation('StickyNotes', {
      offset: { x: 20, y: 20 }, // Position of the annotation
      author: 'Syncfusion',
      pageNumber: this.pdfviewer.currentPageNumber,
      subject: 'Sticky Note',
      isLock: false,
    } as StickyNotesSettings);
  }

  // Add comment to the newly added Sticky Note annotation
  annotationAdd() {
    if (this.annotationAdded) {
      setTimeout(() => {
        // Get the last added annotation
        const addedAnnotation = this.pdfviewer?.annotationCollection[
          this.pdfviewer.annotationCollection.length - 1
        ];
        // Set the comment text
        addedAnnotation.note = 'text';
        // Update the annotation with the new comment
        this.pdfviewer?.annotation.editAnnotation(addedAnnotation);
        console.log(this.pdfviewer?.annotationCollection);
      }, 200);

      // Prevent duplicate comment addition
      this.annotationAdded = false;
    }
  }
}
