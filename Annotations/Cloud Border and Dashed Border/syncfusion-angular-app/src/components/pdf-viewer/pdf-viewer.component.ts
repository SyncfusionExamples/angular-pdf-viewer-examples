import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';

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
  AnnotationService,
  FormFieldsService,
  FormDesignerService,
  PageOrganizerService,
  PdfViewerComponent,
  BorderStyle
} from '@syncfusion/ej2-angular-pdfviewer';

@Component({
  selector: 'app-pdf-viewer',
  standalone: true,
  imports: [CommonModule, PdfViewerModule],
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
    FormFieldsService,
    FormDesignerService,
    PageOrganizerService
  ],
  template: `
    <div class="pdf-viewer-container" style="margin: 30px 90px">
      <div class="toolbar-actions">
        <div class="action-group">
          <h4>Set annotation mode for newly added annotations</h4>
          <button (click)="enableRectangleMode()">Rectangle</button>
          <button (click)="enableCircleMode()">Circle</button>
          <button (click)="enablePolygonMode()">Polygon</button>
          <button (click)="enableFreeTextMode()">Free Text</button>
          <button (click)="enableAreaMode()">Area</button>
          <button (click)="enableLineMode()">Line</button>
        </div>

        <div class="action-group">
          <h4>Exit annotation mode</h4>
          <button (click)="exitAnnotationMode()">Exit Annotation Mode</button>
        </div>

        <div class="action-group">
          <h4>Add annotations programmatically</h4>
          <button (click)="addCloudRectangle()">Cloud Rectangle</button>
          <button (click)="addDashedCircle()">Dashed Circle</button>
          <button (click)="addCloudFreeText()">Cloud Free Text</button>
          <button (click)="addDashedLine()">Dashed Line</button>
          <button (click)="addCloudArea()">Cloud Area</button>
          <button (click)="addDashedRadius()">Dashed Radius</button>
        </div>

        <div class="action-group">
          <h4>Modify existing annotation border</h4>
          <button (click)="applyCloudBorderToSelected()">Apply Cloud Border</button>
          <button (click)="applyDashedBorderToSelected()">Apply Dashed Border</button>
          <button (click)="resetBorderOfSelected()">Reset To Solid</button>
        </div>
      </div>

      <ejs-pdfviewer
        #pdfViewer
        id="container"
        [documentPath]="documentPath"
        [resourceUrl]="resourceUrl"
        [rectangleSettings]="rectangleSettings"
        [circleSettings]="circleSettings"
        [freeTextSettings]="freeTextSettings"
        [cloudSettings]="cloudSettings"
        [lineSettings]="lineSettings"
        [polygonSettings]="polygonSettings"
        [areaSettings]="areaSettings"
        style="height: 650px; display: block">
      </ejs-pdfviewer>
    </div>
  `,
  styles: [`
    .toolbar-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      margin-bottom: 12px;
    }
    .action-group {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px;
      padding: 10px 12px;
      border: 1px solid #e0e0e0;
      border-radius: 6px;
    }
    .action-group h4 {
      width: 100%;
      margin: 0 0 4px;
      font-size: 13px;
      font-weight: 600;
      color: #424242;
    }
    .action-group button {
      padding: 6px 12px;
      font-size: 13px;
      color: #1b1b1b;
      background: #ffffff;
      border: 1px solid #bdbdbd;
      border-radius: 4px;
      cursor: pointer;
    }
    .action-group button:hover {
      background: #f5f5f5;
      border-color: #1976d2;
    }
    .action-group button:focus-visible {
      outline: 2px solid #1976d2;
      outline-offset: 1px;
    }
  `]
})
export class PDFViewerComponent {
  @ViewChild('pdfViewer') public pdfViewer: PdfViewerComponent | undefined;

  public documentPath: string = window.location.origin + '/blank.pdf';
  public resourceUrl: string = 'https://cdn.syncfusion.com/ej2/31.2.2/dist/ej2-pdfviewer-lib';

  public rectangleSettings = {
    strokeColor: '#d32f2f',
    fillColor: '#ffe0b2',
    borderStyle: BorderStyle.Cloud,
    cloudIntensity: 2
  };

  public circleSettings = {
    strokeColor: '#1976d2',
    fillColor: '#bbdefb',
    borderStyle: BorderStyle.Dashed,
    borderDashArray: [5, 5]
  };

  public freeTextSettings = {
    fillColor: 'red',
    borderColor: '#2e7d32',
    fontColor: '#1b5e20',
    opacity: 0.3,
    enableAutoFit: true,
    borderStyle: BorderStyle.Cloud,
    cloudIntensity: 2
  };

  public cloudSettings = {
    opacity: 1,
    strokeColor: '#9c27b0',
    fillColor: '#f3e5f5',
    author: 'Cloud',
    borderStyle: BorderStyle.Cloud,
    cloudIntensity: 2
  };

  public lineSettings = {
    strokeColor: '#f57c00',
    borderStyle: BorderStyle.Dashed,
    borderDashArray: [4, 3]
  };

  public polygonSettings = {
    fillColor: '#ffa5d8',
    strokeColor: '#ff6a00',
    thickness: 2,
    opacity: 0.9,
    borderStyle: BorderStyle.Cloud,
    cloudIntensity: 2
  };

  public areaSettings = {
    fillColor: 'yellow',
    strokeColor: 'orange',
    opacity: 0.6,
    borderStyle: BorderStyle.Cloud,
    cloudIntensity: 2
  };

  private getViewer(): any {
    return this.pdfViewer as any;
  }

  // --- Set the mode used for newly added annotations ---

  enableRectangleMode(): void {
    this.getViewer().annotation.setAnnotationMode('Rectangle');
  }

  enableCircleMode(): void {
    this.getViewer().annotation.setAnnotationMode('Circle');
  }

  enablePolygonMode(): void {
    this.getViewer().annotation.setAnnotationMode('Polygon');
  }

  enableFreeTextMode(): void {
    this.getViewer().annotation.setAnnotationMode('FreeText');
  }

  enableAreaMode(): void {
    this.getViewer().annotation.setAnnotationMode('Area');
  }

  enableLineMode(): void {
    this.getViewer().annotation.setAnnotationMode('Line');
  }

  // --- Exit the annotation mode ---

  exitAnnotationMode(): void {
    this.getViewer().annotation.setAnnotationMode('None');
  }

  // --- Add annotations programmatically with cloud/dashed borders ---

  addCloudRectangle(): void {
    this.getViewer().annotation.addAnnotation('Rectangle', {
      offset: { x: 90, y: 120 },
      pageNumber: 0,
      width: 220,
      height: 110,
      borderStyle: BorderStyle.Cloud,
      cloudIntensity: 2,
      strokeColor: '#d32f2f',
      fillColor: '#ffe0b2',
      opacity: 0.4,
      author: 'Guest'
    } as any);
  }

  addDashedCircle(): void {
    this.getViewer().annotation.addAnnotation('Circle', {
      offset: { x: 360, y: 120 },
      pageNumber: 0,
      width: 140,
      height: 140,
      borderStyle: BorderStyle.Dashed,
      borderDashArray: [5, 5],
      strokeColor: '#1976d2',
      fillColor: '#bbdefb',
      opacity: 0.4,
      author: 'Guest'
    } as any);
  }

  addCloudFreeText(): void {
    this.getViewer().annotation.addAnnotation('FreeText', {
      offset: { x: 90, y: 300 },
      pageNumber: 0,
      width: 220,
      height: 70,
      borderStyle: BorderStyle.Cloud,
      cloudIntensity: 1,
      borderColor: '#2e7d32',
      fillColor: '#e8f5e9',
      fontColor: '#1b5e20',
      opacity: 0.3,
      author: 'Guest'
    } as any);
  }

  addDashedLine(): void {
    this.getViewer().annotation.addAnnotation('Line', {
      offset: { x: 360, y: 330 },
      pageNumber: 0,
      points: [{ x: 360, y: 330 }, { x: 500, y: 400 }],
      borderStyle: BorderStyle.Dashed,
      borderDashArray: [4, 3],
      strokeColor: '#f57c00',
      opacity: 1,
      author: 'Guest'
    } as any);
  }

  addCloudArea(): void {
    this.getViewer().annotation.addAnnotation('Area', {
      offset: { x: 90, y: 430 },
      pageNumber: 0,
      vertexPoints: [
        { x: 90, y: 430 },
        { x: 300, y: 430 },
        { x: 300, y: 520 },
        { x: 90, y: 520 }
      ],
      borderStyle: BorderStyle.Cloud,
      cloudIntensity: 2,
      strokeColor: '#c2185b',
      fillColor: '#fce4ec',
      opacity: 0.4,
      author: 'Guest'
    } as any);
  }

  addDashedRadius(): void {
    this.getViewer().annotation.addAnnotation('Radius', {
      offset: { x: 380, y: 470 },
      pageNumber: 0,
      points: [{ x: 380, y: 470 }, { x: 470, y: 470 }],
      borderStyle: BorderStyle.Dashed,
      borderDashArray: [6, 3],
      strokeColor: '#00838f',
      opacity: 1,
      author: 'Guest'
    } as any);
  }

  // --- Modify the border style of the currently selected annotation ---
  updateSelectedBorder(borderStyle: any, extra: { [key: string]: any } = {}): void {
    const viewer = this.getViewer();
    const annotation = viewer.annotationCollection[viewer.annotationCollection.length - 1];

    if (!annotation) {
      return;
    }

    // Set border style
    annotation.borderStyle = borderStyle;

    // Apply additional properties dynamically
    Object.entries(extra).forEach(([key, value]) => {
      (annotation as any)[key] = value;
    });

    viewer.annotation.editAnnotation(annotation);
  }

  applyCloudBorderToSelected(): void {
    this.updateSelectedBorder(BorderStyle.Cloud, { cloudIntensity: 2 });
  }

  applyDashedBorderToSelected(): void {
    this.updateSelectedBorder(BorderStyle.Dashed, { borderDashArray: [5, 5] });
  }

  resetBorderOfSelected(): void {
    this.updateSelectedBorder(BorderStyle.Solid, { borderDashArray: null, cloudIntensity: 1 });
  }
}
