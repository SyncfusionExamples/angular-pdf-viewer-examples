# PDF Files Directory - Sample Documentation

This directory contains sample PDF files for the Deployment Integration documentation viewer.

## Current Status

The PDF viewer is configured to load the following documents:

1. **Deployment-Guide.pdf** - Deployment Integration Guide
2. **User-Manual.pdf** - User Manual & Instructions  
3. **Troubleshooting.pdf** - Troubleshooting & FAQs

## How to Add PDF Files

### Step 1: Prepare Your PDF
- Create or export your documentation as PDF files
- Ensure PDFs are readable and properly formatted

### Step 2: Add to This Directory
- Place PDF files in this folder: `src/assets/pdfs/`
- Use clear, descriptive filenames

### Step 3: Update PDF Service (Optional)
If you want to add more documents, edit `src/app/services/pdf.service.ts`:

```typescript
private documents: PDFDocument[] = [
  {
    id: 'your-doc-id',
    name: 'Display Name',
    title: 'Full Title',
    description: 'Brief description',
    path: 'assets/pdfs/Your-File.pdf',
    icon: 'document'
  }
];
```

## Sample PDFs Included

The project comes with three sample PDF templates. To use them:

### Option A: Replace with Real PDFs
1. Delete the placeholder PDFs
2. Add your actual PDF files
3. Update filenames in `pdf.service.ts` if needed

### Option B: Generate Sample PDFs
Use tools like:
- **Libre Office** - Free PDF export
- **Google Docs** - Export to PDF
- **Microsoft Word** - Save as PDF
- **Online converters** - Convert DOC/DOCX to PDF
- **PDF generators** - Create PDFs from HTML/Markdown

## Creating Sample PDFs Programmatically

If you want to generate sample PDFs in the app:

```bash
npm install jspdf pdfkit
```

Then use `pdfkit` or `jspdf` to generate PDFs on-the-fly.

## File Size Recommendations

- **Recommended max size**: 50 MB per PDF
- **Optimal size**: 2-10 MB for web delivery
- **Best practice**: Compress PDFs before uploading

## Testing with Sample PDFs

### Quick Test Option:
Create simple text PDFs using your system:
1. Open Notepad
2. Type sample content
3. Save as .txt, then use an online converter to PDF
4. Place in `src/assets/pdfs/`

### Alternative Test Option:
Download sample PDFs from:
- [Sample PDFs](https://www.adobe.io/content/dam/udp/assets/open/pdf/datasheet/Adobe_FY16_Booklet.pdf)
- Generate using Google Docs → Download as PDF

## Current Sample Files

If the project created sample PDFs, they would appear here:
```
src/assets/pdfs/
├── Deployment-Guide.pdf
├── User-Manual.pdf
├── Troubleshooting.pdf
└── README-SAMPLES.md (this file)
```

## Important Notes

✅ **Supported Formats**: PDF (.pdf)  
✅ **Locations**: Can be local (src/assets/pdfs/) or remote (HTTP URL)  
✅ **Caching**: Files are cached by the browser for offline access  
✅ **Security**: PDFs are served from trusted local storage  

❌ **Not Supported**: Doc, Word, Excel, Images (use PDF format)  

## Syncfusion PDF Viewer Features

Once integrated, the viewer will support:
- ✅ Page navigation (next, previous, go to page)
- ✅ Zoom controls (in, out, fit to page)
- ✅ Text search and highlighting
- ✅ Page thumbnails sidebar
- ✅ Download/Print functionality
- ✅ Annotation tools (optional)
- ✅ Full-screen viewing
- ✅ Responsive design for mobile

## Troubleshooting

### PDF Won't Load
1. Check file path is correct
2. Verify file exists in `src/assets/pdfs/`
3. Check browser console for errors
4. Ensure PDF is not corrupted

### Viewer Not Displaying
1. Verify Syncfusion is installed: `npm list @syncfusion/ej2-angular-pdfviewer`
2. Check component is properly imported
3. Review browser console for errors
4. Ensure styles are loaded

### File Size Issues
1. Compress PDFs: Use online compressors
2. Split large documents into multiple PDFs
3. Use PDF optimization tools

## Next Steps

1. Add your actual PDF files to this directory
2. Update document list in `pdf.service.ts` if needed
3. Test in development server: `npm start`
4. The app will automatically load and display PDFs

---

**Created**: April 17, 2026  
**Last Updated**: Phase 2 - PDF Viewer Integration
