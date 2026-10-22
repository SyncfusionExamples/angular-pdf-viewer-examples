# DateTime Picker Form Field in Angular PDF Viewer

This sample demonstrates the **DateTime Picker** form field in the Syncfusion Angular PDF Viewer. It shows how to add date and time fields programmatically using the `formDesigner` module, and how to switch the designer into the DateTime Picker / Time Picker field modes so users can place those fields interactively.

## What is covered

- **Add a Date field programmatically** using `addFormField('Textbox', { ... isDateField: true, actions: { format: { script: 'AFDate_FormatEx("m/d/yy")' } } })`.
- **Add a Time field programmatically** using `addFormField('Textbox', { ... isDateField: true, actions: { format: { script: 'AFTime_FormatEx("HH:MM")' } } })`.
- **Add DateTime / Time fields dynamically** by switching the designer into a field mode with `formDesigner.setFormFieldMode('DateTime')` / `setFormFieldMode('Time')`.
- Common appearance properties: `fontSize`, `color`, `fontFamily`, `backgroundColor`, `borderColor`, `alignment`, `visibility`, `isRequired`, `isPrint`, `thickness`, `tooltip`.
- Fields accept values by direct typing or through the integrated calendar/time dropdown, with strict format validation (invalid values are rejected).

## Supported format strings

| Format String | Example Output |
|---|---|
| `m/d/yy` | `10/19/26` |
| `mm/dd/yyyy` | `10/19/2026` |
| `HH:MM` | `14:30` |
| `HH:MM:ss` | `14:30:45` |

## Run the sample

```bash
cd syncfusion-angular-app
npm install
npm start
```

Once the sample is running, click **Add Date Picker** / **Add Time Picker** to drop the
corresponding fields onto page 1, or click **Set DateTime Picker Mode** / **Set Time Picker Mode**
and then drag on the page to place a field interactively.

## Learn more

- [Create Form Fields in Angular PDF Viewer UG](https://help.syncfusion.com/document-processing/pdf/pdf-viewer/angular/getting-started)
- [Form Designer overview](https://ej2.syncfusion.com/angular/documentation/api/pdfviewer/formdesigner)
