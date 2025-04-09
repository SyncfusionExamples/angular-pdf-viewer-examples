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
import { AppComponent } from './app.component';

@NgModule({
  imports: [
    BrowserModule,
    PdfViewerModule,
    AppComponent
  ],
  providers: [LinkAnnotationService,
    BookmarkViewService,
    MagnificationService,
    ThumbnailViewService,
    ToolbarService,
    NavigationService,
    TextSearchService,
    TextSelectionService,
    PrintService],
  bootstrap: [AppComponent]
})
export class AppModule { }
