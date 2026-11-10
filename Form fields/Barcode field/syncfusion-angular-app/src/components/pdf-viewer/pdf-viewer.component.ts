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

/** Ways in which the barcode payload is built from the linked form fields. */
type BarcodeValueFormat = 'TabDelimited' | 'Xml' | 'CustomValue';

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
  valueFormat?: BarcodeValueFormat;
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

/** Default values used by the settings panel; every field has a non-optional value so
 *  the same property can be passed to update callbacks without the `string | undefined`
 *  narrowing required by the strict Angular template type checker. */
interface ISettings {
  symbology: BarcodeSymbology;
  xDimension: number;
  errorCorrectionLevel: string;
  valueFormat: BarcodeValueFormat;
  includeFieldNames: boolean;
  compressData: boolean;
  customValue: string;
  caption: string;
}

interface IBarcodeFieldInfo {
  id: string;
  name: string;
  symbology: string;
  valueFormat: string;
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

  public symbologies: string[] = ['PDF417', 'QRCode', 'DataMatrix'];
  public valueFormats: string[] = ['TabDelimited', 'Xml', 'CustomValue'];
  public pdf417ErrorLevels: string[] = [
    'Auto', 'Level0', 'Level1', 'Level2', 'Level3', 'Level4', 'Level5', 'Level6', 'Level7', 'Level8'
  ];
  public qrErrorLevels: string[] = ['Low', 'Medium', 'Quartile', 'High'];

  /** Settings applied to the barcode fields that are added or edited from this sample. */
  public settings: ISettings = {
    symbology: 'PDF417',
    xDimension: 4,
    errorCorrectionLevel: 'Level5',
    valueFormat: 'TabDelimited',
    includeFieldNames: true,
    compressData: false,
    customValue: '',
    caption: ''
  };

  /** Comma separated list of form field names whose values are encoded by the barcode. */
  public linkedFields: string = '';

  /** Barcode fields currently present in the viewer. */
  public barcodeFields: IBarcodeFieldInfo[] = [];
  public selectedFieldId: string = '';

  /** Returns the error correction levels available for the given symbology. */
  public get errorLevels(): string[] {
    return this.settings.symbology === 'QRCode' ? this.qrErrorLevels : this.pdf417ErrorLevels;
  }

  /** The error correction level is not applicable to the Data Matrix symbology. */
  public get isErrorLevelEnabled(): boolean {
    return this.settings.symbology !== 'DataMatrix';
  }

  /** The custom value is only used when the value format is `CustomValue`. */
  public get isCustomValueEnabled(): boolean {
    return this.settings.valueFormat === 'CustomValue';
  }

  /** Keeps the error correction level valid for the selected symbology. */
  public onSymbologyChange(): void {
    if (this.settings.symbology === 'QRCode') {
      this.settings.errorCorrectionLevel = 'Medium';
    } else if (this.settings.symbology === 'PDF417') {
      this.settings.errorCorrectionLevel = 'Level5';
    } else {
      this.settings.errorCorrectionLevel = '';
    }
  }

  /** Collects the barcode fields once the document is loaded. */
  public onDocumentLoad(): void {
    this.refreshBarcodeFields();
  }

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

  /** Adds a barcode field using the settings configured in the settings panel. */
  public addBarcodeField(symbology?: BarcodeSymbology): void {
    const viewer = this.pdfViewer as any;
    if (!viewer) {
      return;
    }

    const options: IBarcodeFieldSettings = {
      name: 'Barcode' + this.barcodeFields.length,
      bounds: { X: 100, Y: 150, Width: 200, Height: 80 },
      pageNumber: 1,
      symbology: symbology ?? this.settings.symbology,
      xDimension: this.settings.xDimension,
      errorCorrectionLevel: this.isErrorLevelEnabled ? this.settings.errorCorrectionLevel : undefined,
      valueFormat: this.settings.valueFormat,
      includeFieldNames: this.settings.includeFieldNames,
      compressData: this.settings.compressData,
      caption: this.settings.caption,
      customValue: this.settings.customValue,
      fields: this.getLinkedFields()
    };

    viewer.formDesignerModule.addFormField('Barcode', options);
    this.refreshBarcodeFields();
  }

  /** Applies the configured settings as the viewer level defaults for new barcode fields. */
  public applyViewerSettings(): void {
    const viewer = this.pdfViewer as any;
    if (!viewer) {
      return;
    }

    viewer.barcodeFieldSettings = {
      symbology: this.settings.symbology,
      xDimension: this.settings.xDimension,
      errorCorrectionLevel: this.isErrorLevelEnabled ? this.settings.errorCorrectionLevel : undefined,
      valueFormat: this.settings.valueFormat,
      includeFieldNames: this.settings.includeFieldNames,
      compressData: this.settings.compressData,
      caption: this.settings.caption
    };
  }

  /** Switches the form designer into the barcode placement mode. */
  public enableBarcodeMode(): void {
    const viewer = this.pdfViewer as any;
    if (!viewer) {
      return;
    }
    viewer.formDesignerModule.setFormFieldMode('Barcode');
  }

  /** Applies the configured settings to the barcode field selected in the edit panel. */
  public updateSelectedField(): void {
    const viewer = this.pdfViewer as any;
    if (!viewer || !this.selectedFieldId) {
      return;
    }

    viewer.formDesignerModule.updateFormField(this.selectedFieldId, {
      symbology: this.settings.symbology,
      xDimension: this.settings.xDimension,
      errorCorrectionLevel: this.isErrorLevelEnabled ? this.settings.errorCorrectionLevel : undefined,
      valueFormat: this.settings.valueFormat,
      includeFieldNames: this.settings.includeFieldNames,
      compressData: this.settings.compressData,
      caption: this.settings.caption,
      customValue: this.settings.customValue,
      fields: this.getLinkedFields()
    });
    this.refreshBarcodeFields();
  }

  /** Changes only the symbology of the selected barcode field. */
  public updateSymbology(symbology: BarcodeSymbology): void {
    const viewer = this.pdfViewer as any;
    if (!viewer || !this.selectedFieldId) {
      return;
    }

    viewer.formDesignerModule.updateFormField(this.selectedFieldId, { symbology: symbology });
    this.refreshBarcodeFields();
  }

  /** Changes only the error correction level of the selected barcode field. */
  public updateErrorCorrectionLevel(errorCorrectionLevel: string): void {
    const viewer = this.pdfViewer as any;
    if (!viewer || !this.selectedFieldId) {
      return;
    }

    viewer.formDesignerModule.updateFormField(this.selectedFieldId, { errorCorrectionLevel: errorCorrectionLevel });
    this.refreshBarcodeFields();
  }

  /** Changes only the X-Dimension (module width) of the selected barcode field. */
  public updateXDimension(xDimension: number): void {
    const viewer = this.pdfViewer as any;
    if (!viewer || !this.selectedFieldId) {
      return;
    }

    viewer.formDesignerModule.updateFormField(this.selectedFieldId, { xDimension: xDimension });
    this.refreshBarcodeFields();
  }

  /** Changes only the value format of the selected barcode field. */
  public updateValueFormat(valueFormat: BarcodeValueFormat): void {
    const viewer = this.pdfViewer as any;
    if (!viewer || !this.selectedFieldId) {
      return;
    }

    viewer.formDesignerModule.updateFormField(this.selectedFieldId, { valueFormat: valueFormat });
    this.refreshBarcodeFields();
  }

  /** Sets the custom value that is encoded by the selected barcode field. */
  public updateCustomValue(customValue: string): void {
    const viewer = this.pdfViewer as any;
    if (!viewer || !this.selectedFieldId) {
      return;
    }

    viewer.formDesignerModule.updateFormField(this.selectedFieldId, { customValue: customValue });
    this.refreshBarcodeFields();
  }

  /** Sets the caption drawn below the barcode of the selected field. */
  public updateCaption(caption: string): void {
    const viewer = this.pdfViewer as any;
    if (!viewer || !this.selectedFieldId) {
      return;
    }

    viewer.formDesignerModule.updateFormField(this.selectedFieldId, { caption: caption });
    this.refreshBarcodeFields();
  }

  /** Removes the barcode field that is selected in the edit panel. */
  public deleteSelectedField(): void {
    const viewer = this.pdfViewer as any;
    if (!viewer || !this.selectedFieldId) {
      return;
    }

    viewer.formDesignerModule.deleteFormField(this.selectedFieldId);
    this.selectedFieldId = '';
    this.refreshBarcodeFields();
  }

  /** Regenerates the barcode glyph of the fields that encode the given form field. */
  public refreshLinkedBarcode(fieldName: string): void {
    const viewer = this.pdfViewer as any;
    if (!viewer || !fieldName) {
      return;
    }

    viewer.formDesignerModule.refreshBarcodeGlyphsForLinkedField(fieldName);
  }

  /** Reads the comma separated linked field names. */
  private getLinkedFields(): string[] {
    return this.linkedFields
      .split(',')
      .map((name: string) => name.trim())
      .filter((name: string) => name.length > 0);
  }

  /** Collects the barcode fields that are currently present in the viewer. */
  private refreshBarcodeFields(): void {
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
        symbology: field.symbology,
        valueFormat: field.valueFormat
      }));

    if (!this.barcodeFields.some((field: IBarcodeFieldInfo) => field.id === this.selectedFieldId)) {
      this.selectedFieldId = this.barcodeFields.length ? this.barcodeFields[0].id : '';
    }
  }
}
