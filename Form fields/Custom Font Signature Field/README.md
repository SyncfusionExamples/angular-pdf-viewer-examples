# Custom Font Signature Field

This sample demonstrates how to configure custom fonts for signature fields in the PDF Viewer component.

## Features
- **Custom Signature Fonts:** Configure multiple fonts (Allura, Tangerine, Sacramento, Inspiration) for signature fields
- **Multiple Display Modes:** Support for both Draw and Text modes for signatures
- **Initial Settings:** Configure fonts for initial/signature fields
- **Hand-Written Signature:** Support for hand-written signature settings

## Configuration Details

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

# Running the Angular Sample

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

### Running the Custom Font Signature Field Sample

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