# Barcode Form Field in Angular PDF Viewer

This sample demonstrates the **barcode form field** in the Syncfusion Angular PDF Viewer. It shows how to add barcode fields programmatically, how to change the barcode type (symbology) and its options on an existing field, and how the barcode value is built from the other form fields in the document.

## What is covered

- **Add a barcode field programmatically** with `formDesignerModule.addFormField('Barcode', { ... })`.
- **Place a barcode field interactively** by switching the designer into the barcode mode with `formDesignerModule.setFormFieldMode('Barcode')` and dragging on the page.
- **Change the barcode type** of an existing field — PDF417, QR Code and Data Matrix are supported.
- **Edit the barcode options** of an existing field — X-Dimension, error correction level, value format, linked fields, custom value, caption and data compression.
- **Configure the viewer level defaults** through `barcodeFieldSettings`, so every barcode field that is added afterwards starts with those values.
- **Delete a barcode field** with `formDesignerModule.deleteFormField(...)`.

## Supported barcode types

| Symbology | Error correction levels | Notes |
|---|---|---|
| `PDF417` | `Auto`, `Level0` … `Level8` | The default symbology of a new barcode field. |
| `QRCode` | `Low`, `Medium`, `Quartile`, `High` | Recommended for links and short payloads. |
| `DataMatrix` | Not applicable | The error correction level is ignored for this symbology. |

## Value formats

| Value format | Payload |
|---|---|
| `TabDelimited` | The values of the linked fields separated by a tab character. The field names are included when `includeFieldNames` is enabled. |
| `Xml` | The values of the linked fields are exported as an XFDF fragment. |
| `CustomValue` | The payload is the `customValue` string and the linked fields are ignored. |

## Add a barcode field programmatically

```typescript
const viewer = this.pdfViewer as any;

viewer.formDesignerModule.addFormField('Barcode', {
  name: 'Barcode0',
  bounds: { X: 100, Y: 150, Width: 200, Height: 80 },
  pageNumber: 1,
  symbology: 'QRCode',
  xDimension: 4,
  errorCorrectionLevel: 'Medium',
  valueFormat: 'TabDelimited',
  includeFieldNames: true,
  compressData: false,
  caption: 'Scan me',
  fields: ['EmployeeId']
});
```

## Edit an existing barcode field

Only the properties that are supplied are changed, so the remaining properties of the field are left untouched.

```typescript
const viewer = this.pdfViewer as any;

// Change the barcode type.
viewer.formDesignerModule.updateFormField(fieldId, { symbology: 'DataMatrix' });

// Change the X-Dimension (the width of a single barcode module).
viewer.formDesignerModule.updateFormField(fieldId, { xDimension: 6 });

// Change the error correction level.
viewer.formDesignerModule.updateFormField(fieldId, { errorCorrectionLevel: 'High' });

// Change the value format and the encoded value.
viewer.formDesignerModule.updateFormField(fieldId, {
  valueFormat: 'CustomValue',
  customValue: 'SYNCFUSION'
});

// Remove a barcode field.
viewer.formDesignerModule.deleteFormField(fieldId);
```

## Configure the viewer level defaults

`barcodeFieldSettings` supplies the defaults for the barcode fields that are created afterwards. The values that are passed explicitly to `addFormField` always take precedence over these defaults.

```typescript
const viewer = this.pdfViewer as any;

viewer.barcodeFieldSettings = {
  symbology: 'QRCode',
  xDimension: 6
};
```

## Link a barcode field to other form fields

The `fields` property holds the names of the form fields whose values are encoded by the barcode. The linked fields can be of any type — a text box, a password field, a check box, a radio button, a drop-down or a list box — and the barcode glyph is regenerated automatically whenever one of them changes.

```typescript
viewer.formDesignerModule.addFormField('Barcode', {
  name: 'EmployeeBarcode',
  bounds: { X: 100, Y: 150, Width: 200, Height: 80 },
  pageNumber: 1,
  symbology: 'PDF417',
  valueFormat: 'TabDelimited',
  includeFieldNames: true,
  fields: ['EmployeeId', 'EmployeeName']
});
```

## Run the sample

```bash
cd syncfusion-angular-app
npm install
npm start
```

Once the sample is running, use the **Add barcode field programmatically** panel to drop barcode fields onto the document, the **Barcode field settings** panel to configure the symbology and the value options, and the **Edit barcode field** panel to change or delete an existing field.

## Learn more

- [Create Form Fields in Angular PDF Viewer UG](https://help.syncfusion.com/document-processing/pdf/pdf-viewer/angular/getting-started)
- [Form Designer overview](https://ej2.syncfusion.com/angular/documentation/api/pdfviewer/formdesigner)
