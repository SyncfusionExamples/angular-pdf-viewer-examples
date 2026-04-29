---
layout: post
title: Getting started with Syncfusion Angular PDF Viewer in Angular Universal SSR
description: A quick guide to integrate Syncfusion Angular PDF Viewer with Angular Universal Server-Side Rendering.
control: PDF Viewer
platform: document-processing
documentation: ug
---

# Getting started with Syncfusion Angular PDF Viewer in Angular Universal (SSR)

This guide shows how to create an Angular Universal SSR application and integrate the Syncfusion Angular PDF Viewer component.

## Prerequisites

- **Node.js:** v20 or later
- **Angular CLI:** v21 or later
- **npm:** v10 or later

---

## Step 1: Create Angular SSR Project

Create a new Angular application with Server-Side Rendering:

```bash
ng new my-ssr-app --ssr
cd my-ssr-app
```

During setup, choose:
- **Add routing?** Yes/No (based on your needs)
- **Stylesheet format?** CSS (or SCSS/SASS/LESS)

---

## Step 2: Install Syncfusion PDF Viewer

Install the Syncfusion Angular PDF Viewer package:

```bash
npm install @syncfusion/ej2-angular-pdfviewer --save
```

---

## Step 3: Add Syncfusion CSS Imports

Update `src/styles.css` with Syncfusion theme imports:

```css
@import '../node_modules/@syncfusion/ej2-base/styles/material.css';
@import '../node_modules/@syncfusion/ej2-buttons/styles/material.css';
@import '../node_modules/@syncfusion/ej2-dropdowns/styles/material.css';
@import '../node_modules/@syncfusion/ej2-inputs/styles/material.css';
@import '../node_modules/@syncfusion/ej2-navigations/styles/material.css';
@import '../node_modules/@syncfusion/ej2-popups/styles/material.css';
@import '../node_modules/@syncfusion/ej2-splitbuttons/styles/material.css';
@import '../node_modules/@syncfusion/ej2-pdfviewer/styles/material.css';
@import '../node_modules/@syncfusion/ej2-notifications/styles/material.css';
```

---

## Step 4: Create PDF Viewer Component

Generate a new component:

```bash
ng generate component pdf-viewer --standalone
```

{% tabs %}
{% highlight ts tabtitle="Standalone" %}
import { Component, PLATFORM_ID, Inject, OnInit, NO_ERRORS_SCHEMA } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
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
  FormDesignerService, 
  FormFieldsService,
  AnnotationService, 
  PageOrganizerService 
} from '@syncfusion/ej2-angular-pdfviewer';

@Component({
  selector: 'app-pdf-viewer',
  standalone: true,
  imports: [CommonModule, PdfViewerModule],
  schemas: [NO_ERRORS_SCHEMA],
  template: `
    <div class="pdf-viewer-container">
      <h2>PDF Viewer</h2>
      
      <div *ngIf="isBrowser" class="viewer-wrapper">
        <ejs-pdfviewer 
          id="pdfViewer"
          [documentPath]="documentPath"
          [resourceUrl]="resourceUrl"
          style="height:640px;display:block">
        </ejs-pdfviewer>
      </div>
      
      <div *ngIf="!isBrowser" class="ssr-placeholder">
        <p>PDF Viewer loads on client-side</p>
      </div>
    </div>
  `,
  styles: [`
    .pdf-viewer-container {
      padding: 20px;
      background: #f5f5f5;
      border-radius: 8px;
      margin-top: 20px;
    }

    .viewer-wrapper {
      height: 650px;
      border: 1px solid #ddd;
      border-radius: 4px;
      background: white;
      overflow: hidden;
    }

    .ssr-placeholder {
      height: 200px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: white;
      border: 1px solid #ddd;
      border-radius: 4px;
      color: #999;
    }
  `],
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
    FormDesignerService, 
    FormFieldsService, 
    PageOrganizerService
  ]
})
export class PdfViewerComponent implements OnInit {
  isBrowser: boolean;
  documentPath: string = '';
  resourceUrl: string = '';

  constructor(@Inject(PLATFORM_ID) private platformId: object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    if (this.isBrowser) {
      this.documentPath = "https://cdn.syncfusion.com/content/pdf/pdf-succinctly.pdf";
      this.resourceUrl = "https://cdn.syncfusion.com/ej2/31.1.23/dist/ej2-pdfviewer-lib";
    }
  }
}
{% endhighlight %}
{% endtabs %}

---

## Step 5: Add PDF Viewer to App Component

Update `src/app/app.ts`:

{% tabs %}
{% highlight ts tabtitle="Standalone" %}
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PdfViewerComponent } from './pdf-viewer/pdf-viewer.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, PdfViewerComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  title = 'Angular SSR with PDF Viewer';
}
{% endhighlight %}
{% endtabs %}

Update `src/app/app.html`:

```html
<h1>{{ title }}</h1>
<app-pdf-viewer></app-pdf-viewer>
<router-outlet></router-outlet>
```

---

## Step 6: Build and Run

Build the SSR application:

```bash
ng build
```

Run the SSR server:

```bash
npm run serve:ssr:my-ssr-app
```

Open `http://localhost:4000` in your browser. The PDF Viewer should display with toolbar, search, print, and download features.

---

## Use Your Own PDF Document

Update the `documentPath` in `pdf-viewer.component.ts`:

{% tabs %}
{% highlight ts tabtitle="Standalone" %}
ngOnInit(): void {
  if (this.isBrowser) {
    this.documentPath = "https://your-domain.com/assets/my-pdf.pdf";
    this.resourceUrl = "https://cdn.syncfusion.com/ej2/31.1.23/dist/ej2-pdfviewer-lib";
  }
}
{% endhighlight %}
{% endtabs %}

---

## Troubleshooting

**Toolbar not visible?**
- Ensure all CSS imports are in `src/styles.css`
- Check browser console for errors
- Verify services are in providers array

**PDF not loading?**
- Check if `documentPath` URL is accessible
- Verify `resourceUrl` points to correct CDN version

**SSR error "window is not defined"?**
- Use `isPlatformBrowser()` check before accessing browser APIs

---

## See Also

- [Syncfusion Angular PDF Viewer Documentation](https://ej2.syncfusion.com/angular/documentation/pdfviewer/pdfviewer-overview)
- [Angular Universal Documentation](https://angular.io/guide/universal)  
