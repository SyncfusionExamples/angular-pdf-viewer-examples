import { Component } from '@angular/core';
import { PdfViewerModule, LinkAnnotationService, BookmarkViewService,
         MagnificationService, ThumbnailViewService, ToolbarService,
         NavigationService, TextSearchService, TextSelectionService,
         PrintService, FormDesignerService, FormFieldsService,
         AnnotationService, PageOrganizerService, DisplayMode } from '@syncfusion/ej2-angular-pdfviewer';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [PdfViewerModule],
  providers: [ LinkAnnotationService, BookmarkViewService, MagnificationService,
               ThumbnailViewService, ToolbarService, NavigationService,
               TextSearchService, TextSelectionService, PrintService,
               FormDesignerService, FormFieldsService, AnnotationService, PageOrganizerService],
  template: `
  <div style="margin-top: 100px">
    <ejs-pdfviewer
      id="pdfViewer"
      [documentPath]="documentPath"
      [resourceUrl]="resourcesUrl"
      [signatureFieldSettings]="signatureSettings"
      [initialFieldSettings]="initialSettings"
      [handWrittenSignatureSettings]="handWrittenSignatureSettings"
      style="height:640px; display:block">
    </ejs-pdfviewer>
    </div>
  `
})
export class App {
  public documentPath: string =
    'https://cdn.syncfusion.com/content/pdf/pdf-succinctly.pdf';
  public resourcesUrl: string =
    'https://cdn.syncfusion.com/ej2/35.1.46/dist/ej2-pdfviewer-lib';
  public signatureSettings = {
    signatureDialogSettings: {
      displayMode: DisplayMode.Draw | DisplayMode.Text,
    },
    typeSignatureFonts: ['Allura', 'Tangerine', 'Sacramento', 'Inspiration'],
  };
  public initialSettings = {
    initialDialogSettings: {
      displayMode: DisplayMode.Draw | DisplayMode.Text,
    },
    typeInitialFonts: ['Allura', 'Tangerine', 'Sacramento', 'Inspiration'],
  };
  public handWrittenSignatureSettings  = {
    signatureDialogSettings: {
        displayMode: DisplayMode.Draw | DisplayMode.Text,
    },
    initialDialogSettings: {
        displayMode: DisplayMode.Draw | DisplayMode.Text,
    },
    typeSignatureFonts: ['Allura', 'Tangerine', 'Sacramento', 'Inspiration'],
  }
}