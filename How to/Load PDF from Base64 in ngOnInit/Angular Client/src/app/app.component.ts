import { Component, OnInit } from '@angular/core';
import { PdfViewerModule, LinkAnnotationService, BookmarkViewService,
         MagnificationService, ThumbnailViewService, ToolbarService,
         NavigationService, TextSearchService, TextSelectionService,
         PrintService, FormDesignerService, FormFieldsService, 
         AnnotationService, PageOrganizerService } from '@syncfusion/ej2-angular-pdfviewer';
         import { HttpClient } from '@angular/common/http';
@Component({
  selector: 'app-root',
  template: `<div class="content-wrapper">
              <!-- Conditionally render the PDF Viewer or a Loading message -->
              <ng-container *ngIf="isPdfLoaded; else loading">
                <ejs-pdfviewer id="pdfViewer"
                    [resourceUrl]='resource'
                    [documentPath]="base64String" 
                    style="height:1040px;display:block" >
                </ejs-pdfviewer>
              </ng-container>
              <ng-template #loading>
                <p>Loading PDF...</p>
              </ng-template>
             </div>`,
  providers: [ LinkAnnotationService, BookmarkViewService, MagnificationService,
               ThumbnailViewService, ToolbarService, NavigationService,
               TextSearchService, TextSelectionService, PrintService,
               AnnotationService, FormDesignerService, FormFieldsService, PageOrganizerService]
})
export class AppComponent implements OnInit {
  public resource: string = "http://localhost:4200/assets/ej2-pdfviewer-lib";
  base64String: string = ''; 
  isPdfLoaded: boolean = false; 

  constructor(private http: HttpClient) {}
  
  async ngOnInit() {
    await this.fetchBase64FromURL(
      'https://cdn.syncfusion.com/content/pdf/pdf-succinctly.pdf'
    );
  }

  async fetchBase64FromURL(url: string) {
    const requestBody = {
      data: url
    };

    this.http.post('https://localhost:7237/pdfviewer/LoadPdf', requestBody)
      .subscribe((response: any) => {
        this.base64String = response.base64String as string; // Store Base64 string
        this.isPdfLoaded = true; // Mark PDF as loaded
      }, error => {
        console.error('Error loading document', error);
      });
  }
}