
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
// import the PdfViewer Module for the PDF Viewer component
import { PdfViewerModule, LinkAnnotationService, BookmarkViewService, MagnificationService, ThumbnailViewService,
  ToolbarService, NavigationService, TextSearchService, TextSelectionService, PrintService } from '@syncfusion/ej2-angular-pdfviewer';
import { AppComponent } from './app.component';

@NgModule({
  //declaration of ej2-angular-pdfviewer module into NgModule
  imports: [ BrowserModule, PdfViewerModule ],
  declarations: [ AppComponent ],
  bootstrap: [AppComponent],
  providers: [LinkAnnotationService, BookmarkViewService, MagnificationService,
ThumbnailViewService, ToolbarService, NavigationService, TextSearchService, TextSelectionService, PrintService]
})
export class AppModule { }
