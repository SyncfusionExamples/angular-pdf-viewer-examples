import { Component, OnInit, HostListener, Injectable } from '@angular/core';
import { PdfViewerModule, LinkAnnotationService, BookmarkViewService,
         MagnificationService, ThumbnailViewService, ToolbarService,
         NavigationService, TextSearchService, TextSelectionService,
         PrintService, FormDesignerService, FormFieldsService, 
         AnnotationService, PageOrganizerService, CustomToolbarItemModel, LoadEventArgs } from '@syncfusion/ej2-angular-pdfviewer';
import { ClickEventArgs, ToolbarModule, SidebarModule, DragEventArgs  } from '@syncfusion/ej2-angular-navigations';
import { ButtonComponent, ButtonModule } from '@syncfusion/ej2-angular-buttons';
import { HttpClient } from '@angular/common/http';
import {
  PdfDocument,
  PdfPage,
} from '@syncfusion/ej2-pdf';
@Component({
  selector: 'app-root',
  // specifies the template string for the PDF Viewer component
  template: `<div class="content-wrapper" style="display: abosolute;width: 80%;height: 670px">
              <ejs-pdfviewer id="pdfViewer"
                  [resourceUrl]='resource'
                  [toolbarSettings]="toolbarSettings"
                  (toolbarClick)="toolbarClick($event)"
                  (documentLoad)='documentLoaded($event)' 
                  [documentPath]='document' 
                  style="height:740px;width:display:block">
              </ejs-pdfviewer>
            </div>
            <div class="attachment-side-bar-content" style="display: absolute; width: 20%;">
              <ejs-sidebar id="defaultSidebar" #sidebar cssClass="e-outline" class="e-pv-e-attachment-sidebar" width="20%" position="Right" [enableGestures]="false">
                <div style="font-weight: 500; font-size: 16px; height: 24px; margin: 15px 10px 5px;">
                  PDF Attachments Details
                </div>
                <div *ngFor="let file of uploadedFiles; let i = index" class="attachemnt_details" style="flex: 1; padding: 20px; border: 2px solid #007bff; border-radius: 5px; margin-bottom: 10px;">
                  <button class="dropdown-btn" (click)="toggleDropdown(i)">⋮</button>
                  <div class="dropdown-content" [class.show]="dropdownOpen[i]">
                    <a href="#" (click)="deleteFile(i)">Delete</a>
                  </div>
                  <h3>Attached File Details</h3>
                  <p>File Name: {{ file.name }}</p>
                </div>
              </ejs-sidebar>
            </div>
            <style>
              .dropdown-btn {
                background: none;
                border: none;
                font-size: 24px;
                cursor: pointer; 
                float: right;
              }

              .dropdown-content {
                display: none;
                position: absolute;
                background-color: #f9f9f9;
                min-width: 160px;
                box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.2);
                z-index: 1;
              }

              .dropdown-content a {
                color: black;
                padding: 12px 16px;
                text-decoration: none;
                display: block;
              }

              .dropdown-content a:hover {
                background-color: #f1f1f1;
              }
              .dropdown-content.show {
                display: block;
                margin-left: 120px;
                margin-top: 30px;
                box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.2);
                border: 1px solid black;
              }
            </style>`,
  providers: [ LinkAnnotationService, BookmarkViewService, MagnificationService,
               ThumbnailViewService, ToolbarService, NavigationService,
               TextSearchService, TextSelectionService, PrintService,
               AnnotationService, FormDesignerService, FormFieldsService, PageOrganizerService]
})
export class AppComponent implements OnInit {
  public resource: string = "https://cdn.syncfusion.com/ej2/26.2.11/dist/ej2-pdfviewer-lib";
  public document: string = 'https://cdn.syncfusion.com/content/pdf/pdf-succinctly.pdf';
  public attachedDocuments: { name: string, base64: string, type: string  }[] = [];
  public uploadedFiles: { name: string }[] = [];
  public dropdownOpen: boolean[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit() {
    document.addEventListener('click', this.handleClickOutside.bind(this));
  }

  ngOnDestroy() {
    document.removeEventListener('click', this.handleClickOutside.bind(this));
  }

  handleClickOutside(event: Event) {
    const target = event.target as HTMLElement;
    if (!target.closest('.dropdown-btn') && !target.closest('.dropdown-content')) {
      this.dropdownOpen = this.dropdownOpen.map(() => false);
    }
  }
  public attachPdf: CustomToolbarItemModel = {
    prefixIcon: 'e-icons e-link',
    id: 'attach_pdf',
    align: 'Right',
    text: 'Attach PDF',
    tooltipText: 'Attach PDF file',
  };

  toggleDropdown(index: number) {
    this.dropdownOpen = this.dropdownOpen.map((open, i) => i === index ? !open : false);
  }

  private browseFile(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.gif';
    input.onchange = (event: any) => {
      const file = event.target.files[0];
      if (file) {
        this.uploadedFiles.push({ name: file.name });
        this.dropdownOpen.push(false);
        const reader = new FileReader();
        reader.onload = (args: any) => {
          var base64String = args.target.result.split('base64,')[1];
          this.attachedDocuments.push({ name: file.name, base64: base64String, type: file.type });
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  }

deleteFile(index: number): void {
  this.uploadedFiles.splice(index, 1);
  this.attachedDocuments.splice(index, 1);
  this.dropdownOpen.splice(index, 1);
}

public toolbarClick(args: ClickEventArgs): void {
  if (args.item && args.item.id === 'attach_pdf') {
    this.browseFile();
  } else if (args.item && args.item.id === 'download') {
    this.processDocuments();
  }
}

  processDocuments(): void {
    var viewer = (<any>document.getElementById('pdfViewer')).ej2_instances[0];
    viewer.saveAsBlob().then((value: Blob) => {
      const reader = new FileReader();
      reader.onload = () => {
        const uint8Array = new Uint8Array(reader.result as ArrayBuffer);
        let binary = '';
        uint8Array.forEach((byte) => (binary += String.fromCharCode(byte)));
        const base64String = window.btoa(binary);
        const requestBody = {
          attachedDocuments: this.attachedDocuments,
          PrimaryDocument: base64String
        };
    
        this.http.post('https://localhost:7237/pdfviewer/AttachSavePdf', requestBody)
          .subscribe((response: any) => {
            const mergedDocumentBase64 = response.attachedPDF;
            this.downloadBase64File(mergedDocumentBase64, 'merged_document.pdf');
          }, error => {
            console.error('Error processing documents', error);
          });
      };
      reader.readAsArrayBuffer(value);
    });
  }
  
  downloadBase64File(base64Data: string, fileName: string): void {
    const linkSource = `data:application/pdf;base64,${base64Data}`;
    const downloadLink = document.createElement('a');

    downloadLink.href = linkSource;
    downloadLink.download = fileName;
    downloadLink.click();
  }
  public download: CustomToolbarItemModel = {
    prefixIcon: 'e-pv-download-document-icon',
    id: 'download',
    align: 'Right',
    tooltipText: 'Download file',
  };

  public documentLoaded(e: LoadEventArgs): void {
    var viewer = (<any>document.getElementById('pdfViewer')).ej2_instances[0];
    viewer.saveAsBlob().then((value: Blob) => {
      const reader = new FileReader();
      reader.onload = () => {
        const uint8Array = new Uint8Array(reader.result as ArrayBuffer);
        let binary = '';
        uint8Array.forEach((byte) => (binary += String.fromCharCode(byte)));
        const base64String = window.btoa(binary);
        const requestBody = {
          attachedDocuments: this.attachedDocuments,
          PrimaryDocument: base64String
        };
    
        this.http.post('https://localhost:7237/pdfviewer/LoadedPdf', requestBody)
          .subscribe((response: any) => {
            this.attachedDocuments = response.documentCollections;
            if(response.documentCollections.length > 0) {
              for (let i = 0; i < response.documentCollections.length; i++) {
                this.uploadedFiles.push({
                  name: response.documentCollections[i].name
                });
                this.dropdownOpen.push(false);
              }
            }
          }, error => {
            console.error('Error loading document', error);
          });
      };
      reader.readAsArrayBuffer(value);
    });
  }
  
  public toolbarSettings = {
    showTooltip: true,
    toolbarItems: [this.attachPdf, 'OpenOption', 'PageNavigationTool', 'MagnificationTool', 'PanTool', 'SelectionTool', 'SearchOption', 'PrintOption', this.download, 'UndoRedoTool', 'AnnotationEditTool', 'FormDesignerEditTool', 'CommentTool', 'SubmitForm']
  };
}