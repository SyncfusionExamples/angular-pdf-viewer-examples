import { Component, OnInit } from '@angular/core';
import {
  LinkAnnotationService,
  BookmarkViewService,
  MagnificationService,
  ThumbnailViewService,
  ToolbarService,
  NavigationService,
  AnnotationService,
  TextSearchService,
  TextSelectionService,
  FormFieldsService,
  FormDesignerService,
  PrintService,
  PageOrganizerService
} from '@syncfusion/ej2-angular-pdfviewer';

@Component({
  selector: 'app-root',
  // specifies the template string for the PDF Viewer component
  template: `<div class="content-wrapper">
  <ejs-pdfviewer id="pdfViewer"
             [resourceUrl]='resource'
             style="height:640px;display:block">
  </ejs-pdfviewer>
</div>`,
  providers: [
    LinkAnnotationService,
    BookmarkViewService,
    MagnificationService,
    ThumbnailViewService,
    ToolbarService,
    NavigationService,
    AnnotationService,
    TextSearchService,
    TextSelectionService,
    FormFieldsService,
    FormDesignerService,
    PrintService,
    PageOrganizerService]
})
export class AppComponent implements OnInit {
loading = true;
error: string | null = null;
data: any = null;
public resource: string ='https://cdn.syncfusion.com/ej2/23.2.6/dist/ej2-pdfviewer-lib';

ngOnInit(): void {
  this.fetchData();
}

async fetchData(): Promise<void> {
  try {
    const fileName = 'annotations.pdf';
    const response = await fetch(
      `https://localhost:44327/pdfviewer/GetDocument?fileName=${fileName}`
    );
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const pdfData = await response.text();
    setTimeout(() => {
      var pdfviewer = (<any>document.getElementById('pdfViewer')).ej2_instances[0];
      pdfviewer.load(pdfData, null);
    }, 1000);
  } catch (error: any) {
    this.error = error.message;
  } finally {
    this.loading = false;
  }
}
}