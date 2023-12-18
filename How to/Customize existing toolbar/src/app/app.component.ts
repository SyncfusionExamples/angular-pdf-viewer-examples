import { Component, OnInit } from '@angular/core';
import {
  LinkAnnotationService, BookmarkViewService, MagnificationService,
  ThumbnailViewService, ToolbarService, NavigationService,
  AnnotationService, TextSearchService, TextSelectionService,
  PrintService, FormDesignerService, FormFieldsService, CustomToolbarItemModel
} from '@syncfusion/ej2-angular-pdfviewer';

@Component({
  selector: 'app-root',
  template: `<div class="content-wrapper">
                <ejs-pdfviewer id="pdfViewer"
                      [documentPath]="document"
                      [resourceUrl]="resource"
                      [toolbarSettings]="toolbarSettings"
                      (toolbarClick)="toolbarClick($event)"
                      style="height:640px;display:block">
                </ejs-pdfviewer>
             </div>`,
  providers: [LinkAnnotationService, BookmarkViewService, MagnificationService,
    ThumbnailViewService, ToolbarService, NavigationService,
    AnnotationService, TextSearchService, TextSelectionService,
    PrintService, FormDesignerService, FormFieldsService]
})
export class AppComponent implements OnInit {
  public document = 'https://cdn.syncfusion.com/content/pdf/pdf-succinctly.pdf';
  public resource = 'https://cdn.syncfusion.com/ej2/24.1.41/dist/ej2-pdfviewer-lib';

  public toolItem: CustomToolbarItemModel = {
      prefixIcon: 'e-icons e-paste',
      id: 'print',
      tooltipText: 'Custom toolbar item',
      align: 'left'
  };

  public toolbarSettings = {
    showTooltip: true,
    toolbarItems: [this.toolItem,'OpenOption', 'PageNavigationTool', 'MagnificationTool', 'PanTool', 'SelectionTool',
      'SearchOption', 'PrintOption', 'DownloadOption', 'UndoRedoTool', 'AnnotationEditTool',
      'FormDesignerEditTool', 'CommentTool', 'SubmitForm', this.toolItem]
  };
  public toolbarClick(args: any): void {
      var pdfViewer = (<any>document.getElementById('pdfViewer')).ej2_instances[0];
      if (args.item && args.item.id === 'print') {
            pdfViewer.printModule.print();
      } else if (args.item && args.item.id === 'download') {
            pdfViewer.download();
      }
    }
  ngOnInit(): void {
  }


  }
