# Angular Universal SSR + Syncfusion PDF Viewer Integration Guide

## Overview
This document provides deployment and integration guidelines for using Syncfusion PDF Viewer in an Angular Universal (Server-Side Rendering) application.

---

## ✅ Integration Status

Your Angular Universal SSR application has been successfully integrated with Syncfusion PDF Viewer with the following setup:

### Installed Packages
- `@angular/ssr@^21.2.7` - Angular Server-Side Rendering
- `@syncfusion/ej2-angular-pdfviewer` - Syncfusion PDF Viewer component
- `@angular/core@^21.2.0` - Angular core framework
- `express@^5.1.0` - Express server for SSR

### Project Structure
```
SSR/
├── src/
│   ├── app/
│   │   ├── pdf-viewer/
│   │   │   └── pdf-viewer.component.ts    (Client-side PDF Viewer)
│   │   ├── app.ts                          (Root component with PdfViewerComponent)
│   │   ├── app.html                        (Template with <app-pdf-viewer>)
│   │   └── server.ts                       (Express SSR server)
│   ├── main.ts                             (Client bootstrap)
│   └── main.server.ts                      (Server bootstrap)
├── public/
│   └── assets/
│       └── sample.pdf                      (Sample PDF for testing)
├── dist/
│   └── SSR/
│       ├── server/
│       │   └── server.mjs                  (Compiled server)
│       └── browser/                        (Client-side bundle)
└── package.json                            (Dependencies and scripts)
```

---

## 🚀 Running the Application

### Development Mode (Client-Side Angular)
```bash
npm start
```
Runs on `http://localhost:4200`

### SSR Development Build
```bash
ng build
npm run serve:ssr:SSR
```
Runs on `http://localhost:4000`

### Production Build with SSR
```bash
ng build --configuration production
npm run serve:ssr:SSR
```

---

## 🔐 SSR-Safe Implementation

### Key Design Decisions

#### 1. **Platform Detection**
The PDF Viewer component uses Angular's `isPlatformBrowser()` to ensure browser-only APIs are only executed on the client:

```typescript
import { isPlatformBrowser } from '@angular/common';

constructor(@Inject(PLATFORM_ID) private platformId: object) {
  this.isBrowser = isPlatformBrowser(this.platformId);
}
```

#### 2. **Client-Side Only Rendering**
The component uses `*ngIf="isBrowser"` to conditionally render the PDF viewer:
- **Server (SSR):** Shows a placeholder message
- **Browser (Client):** Renders the full PDF viewer with iframe

#### 3. **Dynamic Imports**
For advanced Syncfusion features, use dynamic imports to load components only on the client:
```typescript
if (this.isBrowser) {
  import('@syncfusion/ej2-angular-pdfviewer').then(module => {
    // Initialize Syncfusion components here
  });
}
```

---

## 📋 Important SSR Caveats

### ⚠️ Browser-Only APIs
**DO NOT** use these APIs during server-side rendering:
- `window`, `document`, `localStorage`
- `setTimeout`, `setInterval`
- DOM manipulation libraries
- Any browser-specific events

**FIX:** Wrap them with platform checks:
```typescript
if (isPlatformBrowser(this.platformId)) {
  // Use browser APIs only here
}
```

### ⚠️ Syncfusion License
If using Syncfusion components beyond the free tier:
1. Register your license key in `main.ts`:
```typescript
import { registerLicense } from '@syncfusion/ej2-base';
registerLicense('YOUR_LICENSE_KEY');
```

2. Keep license keys in environment files (not in source control):
```typescript
import { environment } from './environments/environment';
registerLicense(environment.syncfusionKey);
```

### ⚠️ Static Assets
- All PDFs must be placed in `public/assets/` folder
- Reference them as: `/assets/sample.pdf` (absolute path from root)
- Assets are copied to `dist/` during build

### ⚠️ Module Resolution
When importing Syncfusion modules, use conditional imports or lazy loading to avoid bundling browser-only code on the server.

---

## 🛠️ Adding More PDFs

### Step 1: Place PDF in Assets
```bash
cp your-document.pdf "D:\Angular Universal SSR\SSR\public\assets\"
```

### Step 2: Update Component
```typescript
// In pdf-viewer.component.ts
pdfPath: string = 'assets/your-document.pdf';
```

### Step 3: Rebuild and Test
```bash
ng build
npm run serve:ssr:SSR
```

---

## 📦 Deployment Recommendations

### Hosting Platforms

#### **Vercel** (Recommended for Next.js-like Angular SSR)
```bash
vercel deploy
```
- Automatic SSR detection
- Environment variables support
- Serverless function optimization

#### **Node.js Hosting (Heroku, AWS, Azure)**
```bash
# Build
ng build

# Start server
node dist/SSR/server/server.mjs
```

Set environment variables:
```bash
PORT=3000
NODE_ENV=production
```

#### **Docker Deployment**
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build
EXPOSE 4000
CMD ["npm", "run", "serve:ssr:SSR"]
```

Build and run:
```bash
docker build -t ssr-app .
docker run -p 4000:4000 ssr-app
```

---

## 🧪 Testing Deployment

### Pre-Deployment Checklist
- [ ] Build passes: `ng build`
- [ ] SSR starts successfully: `npm run serve:ssr:SSR`
- [ ] PDF Viewer loads on client
- [ ] No console errors on server or browser
- [ ] All assets are in `public/` folder
- [ ] Environment variables are configured

### Performance Tips
1. **Lazy-load PDF Viewer:**
   ```typescript
   const pdfViewerComponent = lazy(() => 
     import('./pdf-viewer.component').then(m => ({ default: m.PdfViewerComponent }))
   );
   ```

2. **Use CDN for assets:**
   - Reference PDFs from a CDN URL instead of local assets
   - Update `pdfPath` to absolute CDN URL

3. **Enable compression:**
   ```typescript
   // In server.ts
   app.use(compression());
   ```

4. **Cache static assets:**
   ```typescript
   app.use(express.static('dist/SSR/browser', { maxAge: '1d' }));
   ```

---

## 📖 UG (User Guide) Documentation Template

### For End Users

#### **How to View PDFs in Your Application**

1. **Access the Application**
   - Navigate to `https://your-app.com`
   - The PDF Viewer will load automatically

2. **Using the PDF Viewer**
   - **Open:** Click the "Open" button to upload a new PDF
   - **Navigate:** Use page numbers to jump to specific pages
   - **Search:** Use the search bar to find text in the PDF
   - **Print:** Click the Print icon to print the document
   - **Download:** Click the Download button to save the PDF

3. **Supported PDF Features**
   - Text selection and copying
   - Zoom in/out
   - Rotate pages
   - Thumbnails panel
   - Annotations (if enabled)

4. **Browser Compatibility**
   - Chrome 90+
   - Firefox 88+
   - Safari 14+
   - Edge 90+

5. **Troubleshooting**
   - **PDF not loading?** Ensure the file is a valid PDF format
   - **Slow performance?** Try refreshing the page
   - **Storage full?** Clear browser cache if applicable

---

## 🔗 Related Resources

- [Angular Universal Documentation](https://angular.io/guide/universal)
- [Syncfusion PDF Viewer API](https://www.syncfusion.com/angular-components/angular-pdf-viewer)
- [Server-Side Rendering Best Practices](https://angular.io/guide/universal)

---

## 📝 Version Information

- **Angular:** 21.2.0+
- **Syncfusion PDF Viewer:** Latest (from npm install)
- **Node.js:** 20+
- **npm:** 10.8.2+
- **Created:** April 20, 2026

---

## 🤝 Support

For issues or questions:
1. Check the [Syncfusion GitHub Issues](https://github.com/syncfusion)
2. Review [Angular SSR Troubleshooting](https://angular.io/guide/universal#troubleshooting)
3. Consult the component documentation in your IDE

---

**Next Steps:**
- [ ] Customize the PDF viewer component styles
- [ ] Add authentication for PDF access
- [ ] Implement PDF upload functionality
- [ ] Add analytics tracking for PDF views
- [ ] Deploy to your hosting platform
