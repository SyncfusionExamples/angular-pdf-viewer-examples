import { Component, ViewEncapsulation } from '@angular/core';
import { PdfComparerModule } from '@syncfusion/ej2-angular-pdfviewer';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [PdfComparerModule],
  encapsulation: ViewEncapsulation.None,
  providers: [],
  template: `
    <ejs-pdfcomparer
      id="pdfViewer"
      [originalDocumentPath]="documentPath"
      [modifiedDocumentPath]="modifiedPath"
      [resourceUrl]="resourcesUrl"
      style="height:640px; display:block">
    </ejs-pdfcomparer>
  `
})
export class App {
  public documentPath: string =
    'https://cdn.syncfusion.com/content/pdf/original-document.pdf';
  public modifiedPath: string =
    'https://cdn.syncfusion.com/content/pdf/modified-document.pdf';
  public resourcesUrl: string =
    'https://cdn.syncfusion.com/ej2/31.2.2/dist/ej2-pdfviewer-lib';
}