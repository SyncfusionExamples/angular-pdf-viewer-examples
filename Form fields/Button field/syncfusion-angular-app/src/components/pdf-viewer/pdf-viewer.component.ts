import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

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
  PdfViewerComponent
} from '@syncfusion/ej2-angular-pdfviewer';

import { ActionType } from '@syncfusion/ej2-pdfviewer';

interface IButtonFieldInfo {
  id: string;
  name: string;
}

@Component({
  selector: 'app-pdf-viewer',
  standalone: true,
  imports: [CommonModule, FormsModule, PdfViewerModule],
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
  templateUrl: './pdf-viewer.component.html',
  styleUrls: ['./pdf-viewer.component.css']
})
export class PDFViewerComponent {
  @ViewChild('pdfViewer')
  public pdfViewer: PdfViewerComponent | undefined;

  public documentPath =
    window.location.origin + '/form_document.pdf';

  public resourceUrl =
    'https://cdn.syncfusion.com/ej2/31.2.2/dist/ej2-pdfviewer-lib';

  /** Button fields currently present in the viewer. */
  public buttonFields: IButtonFieldInfo[] = [];

  /** Selected button field identifier. */
  public selectedFieldId: string = '';

  /** Adds a button field to the document. */
  public addButtonField(): void {
    const viewer = this.pdfViewer as any;

    if (!viewer) {
      return;
    }

    viewer.formDesignerModule.addFormField('ButtonField', {
      name: 'Submit' + (this.buttonFields.length + 1),
      pageNumber: 1,
      bounds: {
        X: 100,
        Y: 350,
        Width: 120,
        Height: 32
      },
      value: 'Submit',
      text: 'Submit',
      tooltip: 'Click to submit',
      actions: {
        mouseUp: {
          action: ActionType.GoTo,
          destinationPageNumber: 5,
          destinationLocation: {
            x: 100,
            y: 100
          },
          zoomValue: 2
        }
      }
    });

    this.refreshButtonFields();
  }

  /** Enables button field designer mode. */
  public enableButtonMode(): void {
    const viewer = this.pdfViewer as any;

    if (!viewer) {
      return;
    }

    viewer.formDesignerModule.setFormFieldMode('ButtonField');
  }

  /** Updates the selected button field. */
  public editButtonField(): void {
    const field = this.getSelectedField();

    if (!field) {
      return;
    }

    const viewer = this.pdfViewer as any;

    viewer.formDesignerModule.updateFormField(field, {
      value: 'Submit Button',
      text: 'Submit Button',
      alignment: 'Left',
      tooltip: 'Updated Submit Button',
      actions: {
        mouseUp: {
          action: ActionType.GoTo,
          destinationPageNumber: 7,
          destinationLocation: {
            x: 100,
            y: 100
          },
          zoomValue: 1
        }
      }
    });

    this.refreshButtonFields();
  }

  /** Deletes the selected button field. */
  public deleteButtonField(): void {
    const field = this.getSelectedField();

    if (!field) {
      return;
    }

    const viewer = this.pdfViewer as any;

    viewer.formDesignerModule.deleteFormField(field);

    this.selectedFieldId = '';
    this.refreshButtonFields();
  }

  /** Collects the available button fields from the viewer. */
  public refreshButtonFields(): void {
    const viewer = this.pdfViewer as any;

    if (!viewer) {
      return;
    }

    const fields: any[] = viewer.formFieldCollections ?? [];

    this.buttonFields = fields
      .filter((field: any) => field.type === 'ButtonField')
      .map((field: any) => ({
        id: field.id,
        name: field.name || field.value || field.id
      }));

    if (
      !this.buttonFields.some(
        (field: IButtonFieldInfo) => field.id === this.selectedFieldId
      )
    ) {
      this.selectedFieldId = this.buttonFields.length
        ? this.buttonFields[0].id
        : '';
    }
  }

  /**
   * Returns the currently selected button field.
   */
  private getSelectedField(): any {
    const viewer = this.pdfViewer as any;

    if (!viewer || !this.selectedFieldId) {
      return null;
    }

    const fields: any[] = viewer.formFieldCollections ?? [];

    const field = fields.find(
      (item: any) => item.id === this.selectedFieldId
    );

    return field ? field : this.selectedFieldId;
  }
}