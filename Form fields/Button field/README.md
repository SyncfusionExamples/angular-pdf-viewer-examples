# Button Form Field in Angular PDF Viewer

This sample demonstrates the **button form field** in the Syncfusion Angular PDF Viewer. It shows how to add button fields programmatically, place button fields interactively using the form designer, update the properties and actions of existing button fields, and remove button fields.

## What is covered

- **Add a button field programmatically** with `formDesignerModule.addFormField('ButtonField', { ... })`.
- **Place a button field interactively** by switching the designer into button field mode with `formDesignerModule.setFormFieldMode('ButtonField')`.
- **Update button field properties** such as text, tooltip, alignment, and button actions using `formDesignerModule.updateFormField(...)`.
- **Configure button actions** to navigate to a specific page and location within the document.
- **Delete a button field** with `formDesignerModule.deleteFormField(...)`.

The fields that are placed through the PDF Viewer UI are listed in the edit panel as well, so a field can be modified or removed regardless of how it was created.

## Supported button actions

| Action | Description |
| --- | --- |
| GoTo | Navigates to a specified page and location in the PDF document. |

## Add a button field programmatically

```Typescript
const viewer = this.pdfViewer as any;

viewer.formDesignerModule.addFormField('ButtonField', {
  name: 'Submit1',
  pageNumber: 1,
  bounds: {
    X: 100,
    Y: 350,
    Width: 120,
    Height: 32
  },
  value: 'Submit',
  text: 'Submit',
  tooltip: 'Click to submit',
  actions: {
    mouseUp: {
      action: ActionType.GoTo,
      destinationPageNumber: 5,
      destinationLocation: {
        x: 100,
        y: 100
      },
      zoomValue: 2
    }
  }
});
```

## Place a button field interactively

```Typescript
const viewer = this.pdfViewer as any;

// Switches the form designer into button field placement mode.
viewer.formDesignerModule.setFormFieldMode('ButtonField');
```

After the mode is active, click on the page to place a button field.

## Update an existing button field

```Typescript
const viewer = this.pdfViewer as any;

// The field is resolved through the `formFieldCollections` entry so that the
// fields placed through the PDF Viewer UI are supported as well.
const field = viewer.formFieldCollections.find(
  (f: any) => f.id === selectedFieldId
);

viewer.formDesignerModule.updateFormField(field, {
  value: 'Submit Button',
  text: 'Submit Button',
  alignment: 'Left',
  tooltip: 'Updated Submit Button',
  actions: {
    mouseUp: {
      action: ActionType.GoTo,
      destinationPageNumber: 7,
      destinationLocation: {
        x: 100,
        y: 100
      },
      zoomValue: 1
    }
  }
});
```

## Configure button actions

```Typescript
actions: {
  mouseUp: {
    action: ActionType.GoTo,
    destinationPageNumber: 7,
    destinationLocation: {
      x: 100,
      y: 100
    },
    zoomValue: 1
  }
}

```

When the button is clicked, the PDF Viewer navigates to the specified page and location in the document.

## Remove a button field

```Typescript
const viewer = this.pdfViewer as any;

viewer.formDesignerModule.deleteFormField(field);
```

## Run the sample

```Shell
cd syncfusion-angular-app
npm install
npm start
```

Once the sample is running, use the **Add button field programmatically** panel to create button fields, **Enable Button Designer Mode** to place button fields interactively, and the **Edit button field** panel to update or delete existing button fields.

## Learn more

- [Create Form Fields in Angular PDF Viewer UG](https://help.syncfusion.com/document-processing/pdf/pdf-viewer/angular/getting-started)
- [Form Designer overview](https://ej2.syncfusion.com/angular/documentation/api/pdfviewer/formdesigner)

