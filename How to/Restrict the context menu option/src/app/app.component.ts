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
    
    public document: string = 'https://cdn.syncfusion.com/content/pdf/blazor-annotations.pdf';
    public resource:string = "https://cdn.syncfusion.com/ej2/30.1.37/dist/ej2-pdfviewer-lib";
    ngOnInit(): void {
        // ngOnInit function
    }
    //Restrict Context Menu Option on TextSelection
    public textSelection(e: TextSelectionStartEventArgs): void {
      if(this.pdfviewerControl)
        this.pdfviewerControl.contextMenuOption = "None";
    }
    //Context Menu Option on AnnotationSelection
    public annotationSelected(e: AnnotationSelectEventArgs): void {
      if(this.pdfviewerControl)
        this.pdfviewerControl.contextMenuOption = "RightClick";
    }
}
