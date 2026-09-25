import { Component, ViewChild, OnInit, OnDestroy, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  PdfViewerModule,
  PdfViewerComponent,
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

interface DifferenceItem {
  pageNumber: number;
  type: string;
  text: string;
  bounds?: any;
  color?: string;
}

interface PageGrouped {
  original: DifferenceItem[];
  modified: DifferenceItem[];
}

interface DifferenceReport {
  totalDifferences: number;
  summary: {
    added: number;
    deleted: number;
    modified: number;
  };
  byPage: Record<number, {
    added: number;
    deleted: number;
    modified: number;
    details: Array<{ type: string; text: string; color?: string }>;
  }>;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, PdfViewerModule],
  encapsulation: ViewEncapsulation.None,
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
    PageOrganizerService
  ],
  templateUrl: `app.html`
})
export class App implements OnInit, OnDestroy {
  @ViewChild('viewer1') viewer1!: PdfViewerComponent;
  @ViewChild('viewer2') viewer2!: PdfViewerComponent;

  // Properties
  originalDocumentPath: string = 'https://cdn.syncfusion.com/content/pdf/original-document.pdf';
  modifiedDocumentPath: string = 'https://cdn.syncfusion.com/content/pdf/modified-document.pdf';
  resourceUrl: string = 'https://cdn.syncfusion.com/ej2/34.2.4/dist/ej2-pdfviewer-lib';

  loadedCount: number = 0;
  viewersLoaded: boolean = false;
  synchronizationEnabled: boolean = true;
  highlightsEnabled: boolean = true;

  ngOnInit(): void {
    console.log('[App] Component initialized');
  }

  ngOnDestroy(): void {
    console.log('[App] Cleaning up resources');
  }

  // Handle document load
  handleDocumentLoad(): void {
    this.loadedCount++;
    if (this.loadedCount === 2 && this.viewer1 && this.viewer2) {
      this.viewersLoaded = true;
      this.syncViewers(this.synchronizationEnabled);
    }
  }

  // Sync viewers
  private syncViewers(enabled: boolean): void {
    if (this.viewer1 && this.viewer2) {
      (this.viewer1 as any).syncViewers(this.viewer2, enabled);
    }
  }

  // Toggle synchronization
  handleToggleSync(): void {
    this.synchronizationEnabled = !this.synchronizationEnabled;
    this.syncViewers(this.synchronizationEnabled);
  }

  // Toggle highlights
  async handleToggleHighlights(): Promise<void> {
    this.highlightsEnabled = !this.highlightsEnabled;

    if (this.viewersLoaded && this.viewer1 && this.viewer2) {
      const options = {
        beforeColor: '#FF0000',
        afterColor: '#00FF00',
        beforeColorOpacity: 0.4,
        afterColorOpacity: 0.4,
        enableHighlights: this.highlightsEnabled
      };

      try {
        // Clear previous comparison
        (this.viewer1 as any).removeSemanticTextCompare?.(this.viewer2);
        // Apply new comparison with updated highlights state
        const result = await (this.viewer1 as any).semanticTextCompare(this.viewer2, options);
        console.log('Highlights updated:', result);
      } catch (error) {
        console.error('Error updating highlights:', error);
      }
    }
    return Promise.resolve();
  }

  // Clear annotations
  handleClearAnnotations(): void {
    if (this.viewer1 && this.viewer2) {
      (this.viewer1 as any).removeSemanticTextCompare?.(this.viewer2);
    }
  }

  // Get differences by type
  async getDifferencesByType(type: string): Promise<DifferenceItem[]> {
    if (!this.viewer1 || !this.viewer2) return [];

    const options = {
      beforeColor: '#FF0000',
      afterColor: '#00FF00',
      beforeColorOpacity: 0.4,
      afterColorOpacity: 0.4,
      enableHighlights: true
    };

    try {
      const result = await (this.viewer1 as any).semanticTextCompare(this.viewer2, options);
      const originalAnnotations = result?.originalDocumentAnnotations || [];
      const modifiedAnnotations = result?.modifiedDocumentAnnotations || [];
      const differences: DifferenceItem[] = [];

      // Extract differences by type from original annotations
      originalAnnotations.forEach((pageAnnotations: any) => {
        pageAnnotations.differenceAnnotations?.forEach((diff: any) => {
          if (diff.textDiffType === type.toLowerCase()) {
            differences.push({
              pageNumber: pageAnnotations.pageNumber,
              type: diff.textDiffType,
              text: diff.textDiffData,
              bounds: diff.annotation?.bounds,
              color: diff.annotation?.color
            });
          }
        });
      });

      // Extract differences by type from modified annotations
      modifiedAnnotations.forEach((pageAnnotations: any) => {
        pageAnnotations.differenceAnnotations?.forEach((diff: any) => {
          if (diff.textDiffType === type.toLowerCase()) {
            // Avoid duplicates
            const exists = differences.find(d =>
              d.pageNumber === pageAnnotations.pageNumber &&
              d.text === diff.textDiffData
            );
            if (!exists) {
              differences.push({
                pageNumber: pageAnnotations.pageNumber,
                type: diff.textDiffType,
                text: diff.textDiffData,
                bounds: diff.annotation?.bounds,
                color: diff.annotation?.color
              });
            }
          }
        });
      });

      console.log(`${type} differences (${differences.length}):`, differences);
      return differences;
    } catch (error) {
      console.error('Error filtering differences:', error);
      return [];
    }
  }

  // Group differences by page
  async groupDifferencesByPage(): Promise<Record<number, PageGrouped>> {
    if (!this.viewer1 || !this.viewer2) return {};

    const options = {
      beforeColor: '#FF0000',
      afterColor: '#00FF00',
      beforeColorOpacity: 0.4,
      afterColorOpacity: 0.4,
      enableHighlights: true
    };

    try {
      const result = await (this.viewer1 as any).semanticTextCompare(this.viewer2, options);
      const originalAnnotations = result?.originalDocumentAnnotations || [];
      const modifiedAnnotations = result?.modifiedDocumentAnnotations || [];
      const grouped: Record<number, PageGrouped> = {};

      // Group original document differences by page
      originalAnnotations.forEach((pageAnnotations: any) => {
        const pageNum = pageAnnotations.pageNumber;
        if (!grouped[pageNum]) {
          grouped[pageNum] = { original: [], modified: [] };
        }
        pageAnnotations.differenceAnnotations?.forEach((diff: any) => {
          grouped[pageNum].original.push({
            pageNumber: pageNum,
            type: diff.textDiffType,
            text: diff.textDiffData,
            bounds: diff.annotation?.bounds,
            color: diff.annotation?.color
          });
        });
      });

      // Group modified document differences by page
      modifiedAnnotations.forEach((pageAnnotations: any) => {
        const pageNum = pageAnnotations.pageNumber;
        if (!grouped[pageNum]) {
          grouped[pageNum] = { original: [], modified: [] };
        }
        pageAnnotations.differenceAnnotations?.forEach((diff: any) => {
          grouped[pageNum].modified.push({
            pageNumber: pageNum,
            type: diff.textDiffType,
            text: diff.textDiffData,
            bounds: diff.annotation?.bounds,
            color: diff.annotation?.color
          });
        });
      });

      console.log('Differences grouped by page:', grouped);
      return grouped;
    } catch (error) {
      console.error('Error grouping differences:', error);
      return {};
    }
  }

  // Compare documents
  async handleCompare(): Promise<void> {
    if (!this.viewersLoaded || !this.viewer1 || !this.viewer2) {
      return Promise.resolve();
    }

    const options = {
      beforeColor: '#FF0000',
      afterColor: '#00FF00',
      beforeColorOpacity: 0.4,
      afterColorOpacity: 0.4,
      enableHighlights: this.highlightsEnabled
    };

    try {
      const result = await (this.viewer1 as any).semanticTextCompare(this.viewer2, options);
      console.log('Full Comparison Result:', result);

      const originalAnnotations = result?.originalDocumentAnnotations || [];
      const modifiedAnnotations = result?.modifiedDocumentAnnotations || [];
      const totalTextDiffCount = result?.totalTextDiffCount || 0;

      console.log('Total Text Differences:', totalTextDiffCount);
      console.log('Original Document Pages:', originalAnnotations.length);
      console.log('Modified Document Pages:', modifiedAnnotations.length);

      let addedCount = 0;
      let deletedCount = 0;
      let modifiedCount = 0;

      // Process original document annotations
      originalAnnotations.forEach((pageAnnotations: any) => {
        const pageNum = pageAnnotations.pageNumber;
        console.log(`\nOriginal Document - Page ${pageNum}:`);
        pageAnnotations.differenceAnnotations?.forEach((diff: any) => {
          const type = diff.textDiffType;
          const text = diff.textDiffData;
          if (type === 'deleted') deletedCount++;
          if (type === 'modified') modifiedCount++;
          if (type === 'added') addedCount++;
          console.log(`  - ${type.toUpperCase()}: "${text?.substring(0, 50)}..."`);
        });
      });

      // Process modified document annotations
      modifiedAnnotations.forEach((pageAnnotations: any) => {
        const pageNum = pageAnnotations.pageNumber;
        console.log(`\nModified Document - Page ${pageNum}:`);
        pageAnnotations.differenceAnnotations?.forEach((diff: any) => {
          const type = diff.textDiffType;
          const text = diff.textDiffData;
          if (type === 'added' && !addedCount) addedCount++;
          if (type === 'modified' && !modifiedCount) modifiedCount++;
          console.log(`  - ${type.toUpperCase()}: "${text?.substring(0, 50)}..."`);
        });
      });

      // Summary
      console.log('\n=== COMPARISON SUMMARY ===');
      console.log(`Total Differences: ${totalTextDiffCount}`);
      console.log(`Deleted: ${deletedCount}`);
      console.log(`Added: ${addedCount}`);
      console.log(`Modified: ${modifiedCount}`);
    } catch (error) {
      console.error('Error during comparison:', error);
    }
    return Promise.resolve();
  }

  // Generate report
  async generateReport(): Promise<DifferenceReport | undefined> {
    if (!this.viewer1 || !this.viewer2) return undefined;

    const options = {
      beforeColor: '#FF0000',
      afterColor: '#00FF00',
      beforeColorOpacity: 0.4,
      afterColorOpacity: 0.4,
      enableHighlights: true
    };

    try {
      const result = await (this.viewer1 as any).semanticTextCompare(this.viewer2, options);
      const originalAnnotations = result?.originalDocumentAnnotations || [];
      const modifiedAnnotations = result?.modifiedDocumentAnnotations || [];
      const totalTextDiffCount = result?.totalTextDiffCount || 0;

      let addedCount = 0;
      let deletedCount = 0;
      let modifiedCount = 0;
      const byPage: Record<number, {
        deleted: number;
        added: number;
        modified: number;
        details: Array<{ type: string; text: string; color?: string }>;
      }> = {};

      // Process all annotations
      originalAnnotations.forEach((pageAnnotations: any) => {
        const pageNum = pageAnnotations.pageNumber;
        if (!byPage[pageNum]) {
          byPage[pageNum] = { deleted: 0, added: 0, modified: 0, details: [] };
        }
        pageAnnotations.differenceAnnotations?.forEach((diff: any) => {
          const type = diff.textDiffType;
          if (type === 'deleted') {
            deletedCount++;
            byPage[pageNum].deleted++;
          } else if (type === 'added') {
            addedCount++;
            byPage[pageNum].added++;
          } else if (type === 'modified') {
            modifiedCount++;
            byPage[pageNum].modified++;
          }
          byPage[pageNum].details.push({
            type,
            text: diff.textDiffData?.substring(0, 100),
            color: diff.annotation?.color
          });
        });
      });

      modifiedAnnotations.forEach((pageAnnotations: any) => {
        const pageNum = pageAnnotations.pageNumber;
        if (!byPage[pageNum]) {
          byPage[pageNum] = { deleted: 0, added: 0, modified: 0, details: [] };
        }
        pageAnnotations.differenceAnnotations?.forEach((diff: any) => {
          const type = diff.textDiffType;
          if (type === 'deleted') {
            deletedCount++;
            byPage[pageNum].deleted++;
          } else if (type === 'added') {
            addedCount++;
            byPage[pageNum].added++;
          } else if (type === 'modified') {
            modifiedCount++;
            byPage[pageNum].modified++;
          }
          byPage[pageNum].details.push({
            type,
            text: diff.textDiffData?.substring(0, 100),
            color: diff.annotation?.color
          });
        });
      });

      const report: DifferenceReport = {
        totalDifferences: totalTextDiffCount,
        summary: {
          added: addedCount,
          deleted: deletedCount,
          modified: modifiedCount
        },
        byPage: byPage
      };

      console.log('=== DETAILED COMPARISON REPORT ===');
      console.log(`Total Text Differences: ${report.totalDifferences}`);
      console.log(`Added: ${report.summary.added}`);
      console.log(`Deleted: ${report.summary.deleted}`);
      console.log(`Modified: ${report.summary.modified}`);
      console.log('\nBreakdown by Page:');
      Object.entries(byPage).forEach(([pageNum, data]) => {
        console.log(`  Page ${pageNum}: +${data.added} -${data.deleted} ~${data.modified}`);
      });
      console.log('\nFull Report:', report);
      return report;
    } catch (error) {
      console.error('Error generating report:', error);
      return undefined;
    }
  }
}