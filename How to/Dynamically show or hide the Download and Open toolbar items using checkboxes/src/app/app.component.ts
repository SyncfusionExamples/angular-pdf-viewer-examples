import { Component, ViewEncapsulation, OnInit,ViewChild} from '@angular/core';
import { PdfViewerComponent, LinkAnnotationService, BookmarkViewService, MagnificationService, ThumbnailViewService, ToolbarService, NavigationService, TextSearchService, TextSelectionService, PrintService, AnnotationService, FormFieldsService, FormDesignerService, PageOrganizerService,PdfViewerModule, TextSelectionStartEventArgs, AnnotationSelectEventArgs } from '@syncfusion/ej2-angular-pdfviewer';
import { SwitchComponent, SwitchModule } from '@syncfusion/ej2-angular-buttons';
import { ClickEventArgs } from '@syncfusion/ej2-buttons';
import { FormsModule } from '@angular/forms';



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
        FormsModule,
        SwitchModule,
        PdfViewerModule,
        
    ],
})

export class AppComponent {
    @ViewChild('pdfviewer')
    public pdfviewerControl: PdfViewerComponent | undefined;
    @ViewChild('switch')
    public switch: SwitchComponent | undefined;
    
    public document: string = 'https://cdn.syncfusion.com/content/pdf/pdf-succinctly.pdf';
    public resource:string = "https://cdn.syncfusion.com/ej2/23.2.6/dist/ej2-pdfviewer-lib";
    public toolbarItems: string[] = [
        'OpenOption', 'PageNavigationTool', 'MagnificationTool', 'PanTool',
        'SelectionTool', 'SearchOption', 'PrintOption', 'DownloadOption',
        'UndoRedoTool', 'AnnotationEditTool', 'FormDesignerEditTool',
        'CommentTool', 'SubmitForm'
    ];
    public toolbarSettings = { showTooltip: true, toolbarItems: [...this.toolbarItems] };
    
public downloadEnabled = true;
public openEnabled = true;

    ngOnInit(): void {
        // ngOnInit function
    }
    public onCheckbox1Change(event: any): void {
        this.toggleToolbarItem('DownloadOption', event.target.checked);
    }

    public onCheckbox2Change(event: any): void {
        this.toggleToolbarItem('OpenOption', event.target.checked);
    }

    private toggleToolbarItem(item: string, show: boolean): void {
        const index = this.toolbarItems.indexOf(item);
    
        if (show && index === -1) {
            this.toolbarItems.push(item);
        } else if (!show && index !== -1) {
            this.toolbarItems.splice(index, 1);
        }
    
        // Update toolbarSettings
        this.toolbarSettings = {
            showTooltip: true,
            toolbarItems: [...this.toolbarItems]
        };
    
        // Apply new settings and reload the viewer
        this.toolbarSettings = this.toolbarSettings;
        this.pdfviewerControl?.dataBind();
        this.pdfviewerControl?.load(this.document, ""); // ✅ This forces toolbar to re-render
    }
    

}

