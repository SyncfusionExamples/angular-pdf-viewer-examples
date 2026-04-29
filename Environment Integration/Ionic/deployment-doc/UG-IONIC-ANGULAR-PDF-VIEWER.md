---
layout: post
title: Getting started with Syncfusion Angular PDF Viewer with Ionic
description: Quick start for integrating Syncfusion Angular PDF Viewer into an Ionic Angular application.
control: PDF Viewer
platform: document-processing
documentation: ug
domainurl: ##DomainURL##
---

# Ionic Angular - PDF Viewer Integration

## Prerequisites

- Node.js v18+
- Ionic CLI: `npm install -g @ionic/cli`

## Step 1: Create Ionic Angular App

```bash
ionic start my-pdf-app tabs --type=angular
cd my-pdf-app
npm install
```

## Step 2: Install Syncfusion PDF Viewer

```bash
npm install @syncfusion/ej2-angular-pdfviewer --save
```

## Step 3: Copy Runtime Assets

The PDF Viewer needs WebAssembly files. Copy them to your public folder:

{% tabs %}
{% highlight bash tabtitle="Windows PowerShell" %}
Copy-Item -Path .\node_modules\@syncfusion\ej2-pdfviewer\dist\ej2-pdfviewer-lib -Destination .\public\assets\ej2-pdfviewer-lib -Recurse -Force
{% endhighlight %}
{% highlight bash tabtitle="macOS / Linux" %}
cp -R ./node_modules/@syncfusion/ej2-pdfviewer/dist/ej2-pdfviewer-lib ./public/assets/ej2-pdfviewer-lib
{% endhighlight %}
{% endtabs %}

## Step 4: Add Global CSS

Open `src/global.scss` and add these imports at the top:

{% tabs %}
{% highlight scss tabtitle="global.scss" %}
@import '@syncfusion/ej2-base/styles/material.css';
@import '@syncfusion/ej2-buttons/styles/material.css';
@import '@syncfusion/ej2-dropdowns/styles/material.css';
@import '@syncfusion/ej2-inputs/styles/material.css';
@import '@syncfusion/ej2-navigations/styles/material.css';
@import '@syncfusion/ej2-popups/styles/material.css';
@import '@syncfusion/ej2-splitbuttons/styles/material.css';
@import '@syncfusion/ej2-pdfviewer/styles/material.css';
@import '@syncfusion/ej2-notifications/styles/material.css';
{% endhighlight %}
{% endtabs %}

## Step 5: Create PDF Service

Create file: `src/app/services/pdf.service.ts`

{% tabs %}
{% highlight ts tabtitle="pdf.service.ts" %}
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface PDFDocument {
  id: string;
  name: string;
  url: string;
}

@Injectable({
  providedIn: 'root',
})
export class PdfService {
  private documents: PDFDocument[] = [
    {
      id: 'sample',
      name: 'Sample PDF',
      url: 'https://cdn.syncfusion.com/content/pdf/pdf-succinctly.pdf',
    },
  ];

  private selectedDocumentSubject = new BehaviorSubject<PDFDocument | null>(
    this.documents[0]
  );
  public selectedDocument$ = this.selectedDocumentSubject.asObservable();

  private pdfUrlSubject = new BehaviorSubject<string>(this.documents[0].url);
  public pdfUrl$ = this.pdfUrlSubject.asObservable();

  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  getDocuments(): Observable<PDFDocument[]> {
    return new Observable((observer) => {
      observer.next(this.documents);
      observer.complete();
    });
  }

  selectDocument(doc: PDFDocument): void {
    this.selectedDocumentSubject.next(doc);
    this.pdfUrlSubject.next(doc.url);
    this.loadingSubject.next(true);
  }

  setLoading(loading: boolean): void {
    this.loadingSubject.next(loading);
  }
}
{% endhighlight %}
{% endtabs %}

## Step 6: Create PDF Viewer Component

Create file: `src/app/components/pdf-viewer/pdf-viewer.component.ts`

{% tabs %}
{% highlight ts tabtitle="pdf-viewer.component.ts" %}
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonSpinner } from '@ionic/angular/standalone';
import { PdfViewerModule } from '@syncfusion/ej2-angular-pdfviewer';
import {
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
  PageOrganizerService,
} from '@syncfusion/ej2-angular-pdfviewer';
import { PdfService, PDFDocument } from '../../services/pdf.service';

@Component({
  selector: 'app-pdf-viewer',
  standalone: true,
  imports: [CommonModule, PdfViewerModule, IonSpinner],
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
    FormDesignerService,
    FormFieldsService,
    AnnotationService,
    PageOrganizerService,
  ],
  templateUrl: './pdf-viewer.component.html',
  styleUrls: ['./pdf-viewer.component.scss'],
})
export class PdfViewerComponent implements OnInit {
  documents: PDFDocument[] = [];
  selectedDocument: PDFDocument | null = null;
  pdfUrl: string = '';
  isLoading: boolean = false;
  resourceUrlPath: string = window.location.origin + '/assets/ej2-pdfviewer-lib';

  constructor(private pdfService: PdfService) {}

  ngOnInit(): void {
    this.pdfService.getDocuments().subscribe((docs) => {
      this.documents = docs;
    });

    this.pdfService.selectedDocument$.subscribe((doc) => {
      this.selectedDocument = doc;
    });

    this.pdfService.pdfUrl$.subscribe((url) => {
      this.pdfUrl = url;
    });

    this.pdfService.loading$.subscribe((loading) => {
      this.isLoading = loading;
    });
  }

  selectDocument(doc: PDFDocument): void {
    this.pdfService.selectDocument(doc);
  }

  onDocumentLoad(): void {
    this.pdfService.setLoading(false);
  }
}
{% endhighlight %}
{% endtabs %}

Create file: `src/app/components/pdf-viewer/pdf-viewer.component.html`

{% tabs %}
{% highlight html tabtitle="pdf-viewer.component.html" %}
<div class="pdf-container">
  <div *ngIf="isLoading" class="loading">
    <ion-spinner name="crescent"></ion-spinner>
  </div>

  <div *ngIf="!isLoading && pdfUrl && selectedDocument" class="viewer">
    <ejs-pdfviewer
      id="pdfViewer"
      [documentPath]="pdfUrl"
      [resourceUrl]="resourceUrlPath"
      (documentLoad)="onDocumentLoad()"
    >
    </ejs-pdfviewer>
  </div>
</div>
{% endhighlight %}
{% endtabs %}

Create file: `src/app/components/pdf-viewer/pdf-viewer.component.scss`

{% tabs %}
{% highlight scss tabtitle="pdf-viewer.component.scss" %}
:host {
  display: block;
  height: 100%;
  width: 100%;
}

.pdf-container {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
}

.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  background: #fff;
}

.viewer {
  flex: 1;
  overflow: hidden;

  ejs-pdfviewer {
    height: 100%;
    width: 100%;
  }

  ::ng-deep {
    .e-pdfviewer-container {
      height: 100%;
    }
  }
}
{% endhighlight %}
{% endtabs %}

## Step 7: Integrate into Tab 1

Modify `src/app/tab1/tab1.page.ts`:

{% tabs %}
{% highlight ts tabtitle="tab1.page.ts" %}
import { Component } from '@angular/core';
import { PdfViewerComponent } from '../components/pdf-viewer/pdf-viewer.component';

@Component({
  selector: 'app-tab1',
  standalone: true,
  imports: [PdfViewerComponent],
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
})
export class Tab1Page {}
{% endhighlight %}
{% endtabs %}

Modify `src/app/tab1/tab1.page.html`:

{% tabs %}
{% highlight html tabtitle="tab1.page.html" %}
<app-pdf-viewer></app-pdf-viewer>
{% endhighlight %}
{% endtabs %}

## Step 8: Run the App

```bash
npm start
```

Open `http://localhost:4200` and click **Tab 1** to see your PDF viewer! ✅

## Step 9: Build for Production

```bash
npm run build
```

The compiled app will be in the `www/` folder.

## Done! ✅

Your Ionic Angular app with Syncfusion PDF Viewer is ready.

**Quick Checklist:**
- ✅ Created Ionic Angular app
- ✅ Installed Syncfusion packages
- ✅ Copied WASM runtime files
- ✅ Added CSS imports
- ✅ Created PDF service
- ✅ Created PDF viewer component
- ✅ Integrated into Tab 1
- ✅ App running and displaying PDFs

---

**Last Updated:** April 20, 2026  
**Tested With:** Ionic v8.0.0 | Angular v20.0.0 | Syncfusion EJ2 PDF Viewer
