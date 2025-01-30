import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
// import the PdfViewer Module for the PDF Viewer component
import { PdfViewerModule, LinkAnnotationService, BookmarkViewService,
         MagnificationService, ThumbnailViewService, ToolbarService,
         NavigationService, TextSearchService, TextSelectionService,
         PrintService, FormDesignerService, FormFieldsService, 
         AnnotationService, PageOrganizerService } from '@syncfusion/ej2-angular-pdfviewer';
import { AppComponent } from './app.component';
import { ClickEventArgs, ToolbarModule, SidebarModule, DragEventArgs  } from '@syncfusion/ej2-angular-navigations';
import { ButtonComponent, ButtonModule } from '@syncfusion/ej2-angular-buttons';
import { HttpClientModule } from '@angular/common/http';

@NgModule({
  //declaration of ej2-angular-pdfviewer module into NgModule
  imports: [BrowserModule, HttpClientModule, PdfViewerModule, SidebarModule, ToolbarModule],
  declarations: [AppComponent],
  bootstrap: [AppComponent],
   providers: [ LinkAnnotationService, BookmarkViewService, MagnificationService,
               ThumbnailViewService, ToolbarService, NavigationService,
               TextSearchService, TextSelectionService, PrintService,
               AnnotationService, FormDesignerService, FormFieldsService, PageOrganizerService]
})
export class AppModule { }