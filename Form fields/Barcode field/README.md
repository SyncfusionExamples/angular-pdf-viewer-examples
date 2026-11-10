# Barcode Form Field in Angular PDF Viewer

This sample demonstrates the **barcode form field** in the Syncfusion Angular PDF Viewer. It shows how to add barcode fields programmatically, how to change the barcode type (symbology) of an existing field, and how to remove a barcode field.

## What is covered

- **Add a barcode field programmatically** with `formDesignerModule.addFormField('Barcode', { ... })`.
- **Place a barcode field interactively** by switching the designer into the barcode mode with `formDesignerModule.setFormFieldMode('Barcode')` and dragging on the page.
- **Change the barcode type** of an existing field — PDF417, QR Code and Data Matrix are supported.
- **Delete a barcode field** with `formDesignerModule.deleteFormField(...)`.

The fields that are placed through the PDF Viewer UI are listed in the edit panel as well, so a field can be changed or removed regardless of how it was created.

## Supported barcode types

| Symbology | Description |
|---|---|
| `PDF417` | The default symbology of a new barcode field. |
| `QRCode` | Recommended for links and short payloads. |
| `DataMatrix` | A dense symbology for short alphanumeric payloads. |

## Add a barcode field programmatically

```typescript
const viewer = this.pdfViewer as any;

viewer.formDesignerModule.addFormField('Barcode', {
  name: 'Barcode1',
  bounds: { X: 100, Y: 150, Width: 200, Height: 80 },
  pageNumber: 1,
  symbology: 'QRCode'
});
```

## Place a barcode field interactively

```typescript
const viewer = this.pdfViewer as any;

// Switches the form designer into the barcode placement mode.
viewer.formDesignerModule.setFormFieldMode('Barcode');
```

After the mode is active, drag on the page to place the barcode field.

## Change the barcode type of an existing field

```typescript
const viewer = this.pdfViewer as any;

// The field is resolved through the `formFieldCollections` entry so that the
// fields placed through the PDF Viewer UI are supported as well.
const field = viewer.formFieldCollections.find((f: any) => f.id === selectedFieldId);

viewer.formDesignerModule.updateFormField(field, { symbology: 'DataMatrix' });
```

## Remove a barcode field

```typescript
const viewer = this.pdfViewer as any;

viewer.formDesignerModule.deleteFormField(field);
```

## Run the sample

```bash
cd syncfusion-angular-app
npm install
npm start
```

Once the sample is running, use the **Add barcode field programmatically** panel to drop barcode fields onto the document, and the **Edit barcode field** panel to change the barcode type of an existing field or to delete it.

## Learn more

- [Create Form Fields in Angular PDF Viewer UG](https://help.syncfusion.com/document-processing/pdf/pdf-viewer/angular/getting-started)
- [Form Designer overview](https://ej2.syncfusion.com/angular/documentation/api/pdfviewer/formdesigner)
