import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import {
  PdfViewerModule,
  LinkAnnotationService,
  BookmarkViewService,
  MagnificationService,
  ThumbnailViewService,
  ToolbarService,
  NavigationService,
  TextSearchService,
  TextSelectionService,
  PrintService
} from '@syncfusion/ej2-angular-pdfviewer';
import { HttpClientModule } from '@angular/common/http'; // Import HttpClientModule
import { AppComponent } from './app.component';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    PdfViewerModule,
    HttpClientModule  // Add HttpClientModule here
  ],
  providers: [
    LinkAnnotationService,
    BookmarkViewService,
    MagnificationService,
    ThumbnailViewService,
    ToolbarService,
    NavigationService,
    TextSearchService,
    TextSelectionService,
    PrintService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
