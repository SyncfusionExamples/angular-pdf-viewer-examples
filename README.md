# Angular PDF Viewer Examples

This repository contains a collection of examples demonstrating how to integrate and use the [PDF Viewer component in Angular](https://www.syncfusion.com/pdf-viewer-sdk/angular-pdf-viewer) applications. These samples showcase various features and configurations of the PDF Viewer, helping developers understand how to implement document viewing capabilities in their Angular projects.

## 📦 Overview

The [PDF Viewer for Angular](https://www.syncfusion.com/pdf-viewer-sdk/angular-pdf-viewer) is a powerful component that allows users to view and interact with PDF documents directly within web applications. It supports features such as:

- Viewing PDF files
- Text selection and copy
- Text search
- Zooming and navigation
- Printing
- Thumbnail, bookmark, and annotation support

These examples illustrate how to set up the PDF Viewer, customize its behavior, and integrate it with other components or services.

## Running the Angular Sample

### General Setup Steps

To run any Angular PDF Viewer sample:

**Step 1:** Open a terminal or command prompt.

**Step 2:** Navigate to the sample directory (e.g., `Form fields/Custom Font Signature Field`).
```bash
cd "Form fields/Custom Font Signature Field"
```

**Step 3:** Install the necessary dependencies specified in the package.json file.
```bash
npm install
```

**Step 4:** Once the installation is complete, start the Angular development server.
```bash
npm start
```

The application will automatically open in your default browser at `http://localhost:4200/`.

### Sample Configuration: Custom Font Signature Field

This sample demonstrates how to configure custom fonts for signature fields in the PDF Viewer component.

#### Features
- **Custom Signature Fonts:** Configure multiple fonts (Allura, Tangerine, Sacramento, Inspiration) for signature fields
- **Multiple Display Modes:** Support for both Draw and Text modes for signatures
- **Initial Settings:** Configure fonts for initial/signature fields
- **Hand-Written Signature:** Support for hand-written signature settings

#### Configuration Details

The sample uses the following key configurations in the component:

```typescript
signatureSettings = {
  signatureDialogSettings: {
    displayMode: DisplayMode.Draw | DisplayMode.Text,
  },
  typeSignatureFonts: ['Allura', 'Tangerine', 'Sacramento', 'Inspiration'],
};

initialSettings = {
  initialDialogSettings: {
    displayMode: DisplayMode.Draw | DisplayMode.Text,
  },
  typeInitialFonts: ['Allura', 'Tangerine', 'Sacramento', 'Inspiration'],
};

handWrittenSignatureSettings = {
  signatureDialogSettings: {
    displayMode: DisplayMode.Draw | DisplayMode.Text,
  },
  initialDialogSettings: {
    displayMode: DisplayMode.Draw | DisplayMode.Text,
  },
  typeSignatureFonts: ['Allura', 'Tangerine', 'Sacramento', 'Inspiration'],
};
```

#### Key Dependencies

- `@angular/core`: ^22.1.0
- `@angular/forms`: ^22.1.0
- `@angular/platform-browser`: ^22.1.0
- `@syncfusion/ej2-angular-pdfviewer`: Latest version
- `@syncfusion/ej2-tailwind3-theme`: Latest version

#### Running the Custom Font Signature Field Sample

```bash
cd "Form fields/Custom Font Signature Field"
npm install
npm start
```

Navigate to `http://localhost:4200/` and interact with the signature fields to see the custom fonts in action.

#### Building for Production

To build the project for production:
```bash
npm run build
```

The compiled artifacts will be stored in the `dist/` directory.
