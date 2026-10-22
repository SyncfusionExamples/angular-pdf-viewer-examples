# Callout Annotation in Angular PDF Viewer

This sample demonstrates how to enable, add, customize, and manage **Callout annotations** in the Angular PDF Viewer using the Syncfusion EJ2 PDF Viewer component. Callout annotations let users place an editable text box on a PDF page and connect it to a target point with one or more callout leader lines — ideal for review notes, labels, and call-outs that reference specific areas of a document without altering the original content.

## What is covered

- Enabling Callout annotations in the PDF Viewer (injecting `AnnotationService` and `ToolbarService`).
- Switching to Callout Annotation mode programmatically (`annotation.setAnnotationMode('Callout')`).
- Exiting Callout Annotation mode (`annotation.setAnnotationMode('None')`).
- Adding a Callout annotation programmatically with `annotation.addAnnotation('Callout', { ... })`, including:
  - `offset`, `pageNumber`
  - `calloutLines` (the ordered leader-line path)
  - `lineEndingStyle`, `borderColor`, `borderWidth`, `borderStyle`
  - `opacity`, `author`
- Editing an existing Callout annotation programmatically (changing bounds, dynamicText, strokeColor, fillColor, textAlign, author) via `annotation.editAnnotation(...)`.

## Run the sample

```bash
cd syncfusion-angular-app
npm install
npm start
```

Once the server is running, open the app and click the buttons in the toolbar above the viewer to switch into Callout mode or add / edit a Callout annotation.

## Learn more

Refer to the Syncfusion UG documentation for the Angular PDF Viewer Callout Annotation feature:

`https://help.syncfusion.com/document-processing/pdf/pdf-viewer/angular/getting-started` (UG section: Callout Annotation in Angular PDF Viewer)
