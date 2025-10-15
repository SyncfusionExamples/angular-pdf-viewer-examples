// Import Angular core modules and Syncfusion PDF Viewer services
import { Component, ViewEncapsulation, OnInit,ViewChild} from '@angular/core';
import { PdfViewerComponent, LinkAnnotationService, BookmarkViewService, MagnificationService, ThumbnailViewService, ToolbarService, NavigationService, TextSearchService, TextSelectionService, PrintService, AnnotationService, FormFieldsService, FormDesignerService, PageOrganizerService,PdfViewerModule, TextSelectionStartEventArgs, AnnotationSelectEventArgs } from '@syncfusion/ej2-angular-pdfviewer';
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
    public pdfviewerControl: PdfViewerComponent | undefined;
    
    public document: string ='https://cdn.syncfusion.com/content/pdf/pdf-succinctly.pdf';
    public resource:string = "https://cdn.syncfusion.com/ej2/31.1.17/dist/ej2-pdfviewer-lib";
    ngOnInit(): void {
        // ngOnInit function
    }
   // Event handler for all viewer-related 
    public triggerEvent(e: any): void {
    console.log('Changes are observed in PDF Viewer!');
  }
}
