import { Component, OnInit } from '@angular/core';
import {
  LinkAnnotationService, BookmarkViewService, MagnificationService,
  ThumbnailViewService, ToolbarService, NavigationService,
  AnnotationService, TextSearchService, TextSelectionService,
  PrintService, FormDesignerService, FormFieldsService, CustomToolbarItemModel
} from '@syncfusion/ej2-angular-pdfviewer';
import { ComboBox } from "@syncfusion/ej2-dropdowns";
import { TextBox } from "@syncfusion/ej2-inputs";

@Component({
  selector: 'app-root',
  template: `<div class="content-wrapper">
                <ejs-pdfviewer id="pdfViewer"
                      [documentPath]="document"
                      [resourceUrl]="resource"
                      [toolbarSettings]="toolbarSettings"
                      [printScaleFactor]="printScaleFactor"
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
  //By changing values here we can change the quality of the PDF file.
  public printScaleFactor = 0.5;
 
  public toolItem1: CustomToolbarItemModel = {
      prefixIcon: 'e-icons e-paste',
      id: 'print',
      tooltipText: 'Custom toolbar item',
  };
  public toolItem2: CustomToolbarItemModel = {
      id: 'download',
      text: 'Save',
      tooltipText: 'Custom toolbar item',
      align: 'right'
  };
  LanguageList: string[] = ['Typescript', 'Javascript', 'Angular', 'C#', 'C', 'Python'];
  public toolItem3: CustomToolbarItemModel = {
      type: 'Input',
      tooltipText: 'Language List',
      cssClass: 'percentage',
      align: 'Left',
      id: 'dropdown',
      template: new ComboBox({ width: 100, value: 'TypeScript', dataSource: this.LanguageList, popupWidth: 85, showClearButton: false, readonly: false })  
  };
  public toolItem4: CustomToolbarItemModel = {
      type: 'Input',
      tooltipText: 'Text',
      align: 'Right',
      cssClass: 'find',
      id: 'textbox',
      template: new TextBox({ width: 125, placeholder: 'Type Here', created: this.OnCreateSearch})
  }
  public toolbarSettings = {
    showTooltip: true,
    toolbarItems: [this.toolItem1, this.toolItem2, 'OpenOption', 'PageNavigationTool', 'MagnificationTool', this.toolItem3, 'PanTool', 'SelectionTool', 'SearchOption', 'PrintOption', 'DownloadOption', 'UndoRedoTool', 'AnnotationEditTool', 'FormDesignerEditTool', this.toolItem4, 'CommentTool', 'SubmitForm']
  };
 
  public toolbarClick(args: any): void {
      var pdfViewer = (<any>document.getElementById('pdfViewer')).ej2_instances[0];
      if (args.item && args.item.id === 'print') {
            pdfViewer.printModule.print();
      } else if (args.item && args.item.id === 'download') {
            pdfViewer.download();
      }
    }
  public OnCreateSearch(this: any): any {
      this.addIcon('prepend', 'e-icons e-search');
  }
  ngOnInit(): void {
  }
}