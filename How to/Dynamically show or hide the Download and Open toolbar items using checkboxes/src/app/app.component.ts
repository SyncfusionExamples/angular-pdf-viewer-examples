import { Component, ViewEncapsulation, ViewChild } from '@angular/core';
import {
  PdfViewerComponent, PdfViewerModule, ToolbarService,
  LinkAnnotationService, BookmarkViewService, MagnificationService,
  ThumbnailViewService, NavigationService, TextSearchService,
  TextSelectionService, PrintService, AnnotationService,
  FormFieldsService, FormDesignerService, PageOrganizerService
} from '@syncfusion/ej2-angular-pdfviewer';
import { SwitchComponent, SwitchModule } from '@syncfusion/ej2-angular-buttons';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  encapsulation: ViewEncapsulation.None,
  providers: [
    // Injecting required services for PDF Viewer functionality
    LinkAnnotationService, BookmarkViewService, MagnificationService,
    ThumbnailViewService, ToolbarService, NavigationService,
    TextSearchService, TextSelectionService, PrintService,
    AnnotationService, FormFieldsService, FormDesignerService, PageOrganizerService
  ],
  styleUrls: ['app.component.css'],
  standalone: true,
  imports: [FormsModule, SwitchModule, PdfViewerModule],
})
export class AppComponent {
  // Reference to the PDF Viewer component
  @ViewChild('pdfviewer') public pdfviewerControl: PdfViewerComponent | undefined;

  // PDF document path and resource URL
  public document: string = 'https://cdn.syncfusion.com/content/pdf/pdf-succinctly.pdf';
  public resource: string = 'https://cdn.syncfusion.com/ej2/23.2.6/dist/ej2-pdfviewer-lib';

  // Initial toolbar items to be displayed
  public toolbarItems: string[] = [
    'OpenOption', 'PageNavigationTool', 'MagnificationTool', 'PanTool',
    'SelectionTool', 'SearchOption', 'PrintOption', 'DownloadOption',
    'UndoRedoTool', 'AnnotationEditTool', 'FormDesignerEditTool',
    'CommentTool', 'SubmitForm'
  ];

  // Toolbar settings configuration
  public toolbarSettings = { showTooltip: true, toolbarItems: [...this.toolbarItems] };

  // Checkbox model bindings
  public downloadEnabled = true;
  public openEnabled = true;

  // Handler for 'Download' checkbox change
  public onCheckbox1Change(event: any): void {
    this.toggleToolbarItem('DownloadOption', event.target.checked);
  }

  // Handler for 'Open' checkbox change
  public onCheckbox2Change(event: any): void {
    this.toggleToolbarItem('OpenOption', event.target.checked);
  }

  // Method to toggle toolbar items based on checkbox state
  private toggleToolbarItem(item: string, show: boolean): void {
    const index = this.toolbarItems.indexOf(item);

    // Add item if not present and checkbox is checked
    if (show && index === -1) {
      this.toolbarItems.push(item);
    }
    // Remove item if present and checkbox is unchecked
    else if (!show && index !== -1) {
      this.toolbarItems.splice(index, 1);
    }

    // Update toolbar settings and rebind PDF Viewer
    this.toolbarSettings = {
      showTooltip: true,
      toolbarItems: [...this.toolbarItems]
    };

    // Refresh the PDF Viewer with updated toolbar
    this.pdfviewerControl?.dataBind();
    this.pdfviewerControl?.load(this.document, '');
  }
}
