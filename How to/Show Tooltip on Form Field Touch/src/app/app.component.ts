import { Component, OnInit, ViewChild } from '@angular/core';
import {
  LinkAnnotationService,
  BookmarkViewService,
  MagnificationService,
  ThumbnailViewService,
  ToolbarService,
  NavigationService,
  AnnotationService,
  TextSearchService,
  TextSelectionService,
  FormFieldsService,
  FormDesignerService,
  PrintService,
  PdfViewerComponent,
  FormFieldFocusOutEventArgs,
  LoadEventArgs,
  FormFieldClickArgs,
  TextFieldSettings
} from '@syncfusion/ej2-angular-pdfviewer';
import { Tooltip } from '@syncfusion/ej2-popups';

@Component({
  selector: 'app-root',
  template: `
    <div class="content-wrapper">
      <ejs-pdfviewer 
        id="pdfViewer"
        [resourceUrl]="resourceUrl"
        [documentPath]="document"
        (formFieldClick)='formFieldClicked($event)' 
        (documentLoad)='documentLoaded($event)' 
        (formFieldFocusOut)='formFieldFocusOut($event)'
        style="height: 640px; display: block;">
      </ejs-pdfviewer>
    </div>
  `,
  providers: [
    LinkAnnotationService,
    BookmarkViewService,
    MagnificationService,
    ThumbnailViewService,
    ToolbarService,
    NavigationService,
    AnnotationService,
    TextSearchService,
    TextSelectionService,
    FormFieldsService,
    FormDesignerService,
    PrintService
  ]
})
export class AppComponent implements OnInit {

    tooltipRef: Tooltip | undefined;
  
    ngAfterViewInit() {
        // Initialize Tooltip
        this.tooltipRef = new Tooltip({
          mouseTrail: true,
          opensOn: 'Custom',
          content: 'Enter your first name'
        });
    } 
  public document: string = 'https://cdn.syncfusion.com/content/pdf/pdf-succinctly.pdf';
  public resourceUrl: string = 'https://cdn.syncfusion.com/ej2/28.1.33/dist/ej2-pdfviewer-lib';

  ngOnInit(): void { }
    documentLoaded(e: LoadEventArgs): void {
        // Add form field after document is loaded
        const viewer = (document.getElementById('pdfViewer') as any).ej2_instances[0];
        if (viewer) {
            viewer.formDesignerModule.addFormField("Textbox", {
                name: 'First Name',
                bounds: { X: 146, Y: 229, Width: 150, Height: 24 }
            } as TextFieldSettings);
        }
    }

    formFieldClicked(args: FormFieldClickArgs): void {
        const viewer = (document.getElementById('pdfViewer') as any).ej2_instances[0];
        if (!viewer) return;
        const formFields = viewer.retrieveFormFields();
        const field = formFields.find((f: { name: string | undefined; id: string | undefined; }) => f.name === args.field.name && f.id === args.field.id);
        if (field && field.id) {
            const element = document.getElementById(field.id);
            if (element && this.tooltipRef) {
                this.tooltipRef.content = "Enter your first name";
                this.tooltipRef.appendTo(element);
                this.tooltipRef.open(element);
                // Remove previous listeners to avoid duplicates
                element.onblur = null;
                element.onmouseleave = null;
                element.ontouchend = null;
                // Add listeners to close tooltip on blur, mouseleave, or touchend
                element.addEventListener('blur', () => {
                    this.tooltipRef?.close();
                });
                element.addEventListener('mouseleave', () => {
                    this.tooltipRef?.close();
                });
                element.addEventListener('touchend', () => {
                    this.tooltipRef?.close();
                });
            }
        }
    }

    formFieldFocusOut(args: FormFieldFocusOutEventArgs): void {
        if (this.tooltipRef) {
            this.tooltipRef.close();
        }
    }
}