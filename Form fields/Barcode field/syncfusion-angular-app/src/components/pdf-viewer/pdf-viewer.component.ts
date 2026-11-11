import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

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
  PrintService,
  AnnotationService,
  FormFieldsService,
  FormDesignerService,
  PageOrganizerService,
  PdfViewerComponent
} from '@syncfusion/ej2-angular-pdfviewer';

/** Barcode symbologies supported by the PDF Viewer barcode form field. */
type BarcodeSymbology = 'PDF417' | 'QRCode' | 'DataMatrix';

/**
 * Mirrors the `BarcodeFieldSettings` interface exposed by the PDF Viewer.
 * It is declared locally so the sample keeps compiling against releases
 * that predate the public `BarcodeFieldSettings` export.
 */
interface IBarcodeFieldSettings {
  name?: string;
  bounds?: { X: number; Y: number; Width: number; Height: number };
  pageNumber?: number;
  symbology?: BarcodeSymbology;
  xDimension?: number;
  errorCorrectionLevel?: string;
  valueFormat?: string;
  includeFieldNames?: boolean;
  compressData?: boolean;
  customValue?: string;
  caption?: string;
  fields?: string[];
  value?: string;
  isReadOnly?: boolean;
  isPrint?: boolean;
  visibility?: string;
  tooltip?: string;
}

/** A barcode form field that is currently present in the viewer. */
interface IBarcodeFieldInfo {
  /** The identifier that is used to resolve the field in the form designer. */
  id: string;
  name: string;
  symbology: string;
}

@Component({
  selector: 'app-pdf-viewer',
  standalone: true,
  imports: [CommonModule, FormsModule, PdfViewerModule],
  providers: [
    LinkAnnotationService,
    BookmarkViewService,
    MagnificationService,
    ThumbnailViewService,
    ToolbarService,
    NavigationService,
    TextSearchService,
    TextSelectionService,
    PrintService,
    AnnotationService,
    FormFieldsService,
    FormDesignerService,
    PageOrganizerService
  ],
  templateUrl: './pdf-viewer.component.html',
  styleUrls: ['./pdf-viewer.component.css']
})
export class PDFViewerComponent {
  @ViewChild('pdfViewer') public pdfViewer: PdfViewerComponent | undefined;

  public documentPath: string = 'https://cdn.syncfusion.com/content/pdf/form-filling-document.pdf';
  public resourceUrl: string = 'https://cdn.syncfusion.com/ej2/31.2.2/dist/ej2-pdfviewer-lib';

  /** The barcode types that a barcode field can be changed to. */
  public symbologies: BarcodeSymbology[] = ['PDF417', 'QRCode', 'DataMatrix'];

  /** Barcode fields currently present in the viewer. */
  public barcodeFields: IBarcodeFieldInfo[] = [];
  public selectedFieldId: string = '';

  /** Adds a PDF417 barcode field to the first page of the document. */
  public addPdf417Barcode(): void {
    this.addBarcodeField('PDF417');
  }

  /** Adds a QR Code barcode field to the first page of the document. */
  public addQrCodeBarcode(): void {
    this.addBarcodeField('QRCode');
  }

  /** Adds a Data Matrix barcode field to the first page of the document. */
  public addDataMatrixBarcode(): void {
    this.addBarcodeField('DataMatrix');
  }

  /** Adds a barcode field of the given symbology to the first page of the document. */
  public addBarcodeField(symbology: BarcodeSymbology): void {
    const viewer = this.pdfViewer as any;
    if (!viewer) {
      return;
    }

    const options: IBarcodeFieldSettings = {
      name: 'Barcode' + (this.barcodeFields.length + 1),
      bounds: { X: 100, Y: 150, Width: 200, Height: 80 },
      pageNumber: 1,
      symbology: symbology
    };

    viewer.formDesignerModule.addFormField('Barcode', options);
    this.refreshBarcodeFields();
  }

  /** Switches the form designer into the barcode placement mode. */
  public enableBarcodeMode(): void {
    const viewer = this.pdfViewer as any;
    if (!viewer) {
      return;
    }
    viewer.formDesignerModule.setFormFieldMode('Barcode');
  }

  /** Changes the barcode type of the selected barcode field. */
  public updateSymbology(symbology: BarcodeSymbology): void {
    const field = this.getSelectedField();
    if (!field) {
      return;
    }

    const viewer = this.pdfViewer as any;
    viewer.formDesignerModule.updateFormField(field, { symbology: symbology });
    this.refreshBarcodeFields();
  }

  /** Removes the barcode field that is selected in the edit panel. */
  public deleteSelectedField(): void {
    const field = this.getSelectedField();
    if (!field) {
      return;
    }

    const viewer = this.pdfViewer as any;
    viewer.formDesignerModule.deleteFormField(field);
    this.selectedFieldId = '';
    this.refreshBarcodeFields();
  }

  /** Collects the barcode fields that are currently present in the viewer. */
  public refreshBarcodeFields(): void {
    const viewer = this.pdfViewer as any;
    if (!viewer) {
      return;
    }

    const fields: any[] = viewer.formFieldCollections ?? [];
    this.barcodeFields = fields
      .filter((field: any) => field.type === 'Barcode')
      .map((field: any) => ({
        id: field.id,
        name: field.name,
        symbology: field.symbology
      }));

    if (!this.barcodeFields.some((field: IBarcodeFieldInfo) => field.id === this.selectedFieldId)) {
      this.selectedFieldId = this.barcodeFields.length ? this.barcodeFields[0].id : '';
    }
  }

  /**
   * Returns the selected barcode field.
   *
   * The collection entry is passed to the form designer instead of its identifier,
   * because a field that was placed through the PDF Viewer UI is registered in the
   * internal field collection under a different identifier than the one reported by
   * `formFieldCollections`. Resolving the field through the collection object lets
   * the form designer look it up correctly in both cases.
   */
  private getSelectedField(): any {
    const viewer = this.pdfViewer as any;
    if (!viewer || !this.selectedFieldId) {
      return null;
    }

    const fields: any[] = viewer.formFieldCollections ?? [];
    const field = fields.find((item: any) => item.id === this.selectedFieldId);
    return field ? field : this.selectedFieldId;
  }
}
