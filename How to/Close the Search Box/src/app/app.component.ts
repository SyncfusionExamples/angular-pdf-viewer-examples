import {
  Component,
  ViewEncapsulation,
  OnInit,
  ViewChild,
  Inject,
} from '@angular/core';
import {
  PdfViewerComponent,
  LinkAnnotationService,
  BookmarkViewService,
  MagnificationService,
  ToolbarService,
  NavigationService,
  TextSelectionService,
  PrintService,
  DynamicStampItem,
  SignStampItem,
  StandardBusinessStampItem,
  PageChangeEventArgs,
  LoadEventArgs,
  AnnotationService,
  FormDesignerService,
  PageOrganizerService,
  TextSearchService,
  TextSelection,
  PdfViewerModule,
} from '@syncfusion/ej2-angular-pdfviewer';
import {
  ToolbarComponent,
  MenuItemModel,
  ToolbarModule,
  MenuModule,
} from '@syncfusion/ej2-angular-navigations';
import { DialogComponent } from '@syncfusion/ej2-angular-popups';
import { ClickEventArgs } from '@syncfusion/ej2-buttons';
import { SwitchComponent, SwitchModule } from '@syncfusion/ej2-angular-buttons';

/**
 * Default PdfViewer Controller
 */
@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  encapsulation: ViewEncapsulation.None,
  providers: [
    LinkAnnotationService,
    BookmarkViewService,
    TextSearchService,
    TextSelectionService,
    MagnificationService,
    ToolbarService,
    NavigationService,
    TextSelectionService,
    PrintService,
    AnnotationService,
    FormDesignerService,
    PageOrganizerService,
  ],
  styleUrls: ['app.component.css'],
  standalone: true,
  imports: [SwitchModule, ToolbarModule, MenuModule, PdfViewerModule],
})
export class AppComponent {
  @ViewChild('pdfviewer')
  public pdfviewerControl: PdfViewerComponent | undefined;
  @ViewChild('customToolbar')
  public customToolbar: ToolbarComponent | undefined;
  @ViewChild('zoomToolbar')
  public zoomToolbar: ToolbarComponent | undefined;

  public document: string =
    'https://cdn.syncfusion.com/content/pdf/pdf-succinctly.pdf';
  public resource: string =
    'https://cdn.syncfusion.com/ej2/23.2.6/dist/ej2-pdfviewer-lib';
  public matchCase = false;
  constructor() {}
  ngOnInit(): void {
    // ngOnInit function
  }

  public documentLoaded(e: LoadEventArgs): void {
    var searchEle = document.getElementById('container_search_box');
    if(searchEle){
    searchEle.style.top = 'auto';
    }
  }

  public findText(e: MouseEvent): void {
    const textSearchToolbarElement =
      document.getElementById('textSearchToolbar');
    if (textSearchToolbarElement !== null) {
      if (textSearchToolbarElement.style.display === 'block') {
        textSearchToolbarElement.style.display = 'none';
      } else {
        textSearchToolbarElement.style.display = 'block';
      }
    }
  }

  public searchInputKeypressed(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.initiateTextSearch();
    }
  }

  public searchText: string = '';
  public prevMatchCase = false;
  public initiateTextSearch(): void {
    const textsearchPrevElement = document.getElementById(
      'container_prev_occurrence'
    ) as HTMLButtonElement;
    const textsearchNextElement = document.getElementById(
      'container_next_occurrence'
    ) as HTMLButtonElement;
    const textsearchcloseElement = document.getElementById(
      'container_close_search_box-icon'
    ) as HTMLElement;
    const textsearchElement = document.getElementById(
      'container_search_box-icon'
    ) as HTMLElement;

    if (
      textsearchPrevElement &&
      textsearchNextElement &&
      textsearchcloseElement &&
      textsearchElement
    ) {
      textsearchPrevElement.disabled = false;
      textsearchNextElement.disabled = false;
      textsearchcloseElement.style.display = 'block';
      textsearchElement.style.display = 'none';

      if (
        this.searchText !==
          (
            document.getElementById(
              'container_search_input'
            ) as HTMLInputElement
          ).value ||
        this.prevMatchCase !== this.matchCase
      ) {
        if(this.pdfviewerControl)
        this.pdfviewerControl.textSearchModule.cancelTextSearch();
        this.searchText = (
          document.getElementById('container_search_input') as HTMLInputElement
        ).value;
        if(this.pdfviewerControl)
        this.pdfviewerControl.textSearchModule.searchText(
          this.searchText,
          this.matchCase
        );
        this.prevMatchCase = this.matchCase;
      } else {
        this.nextTextSearch();
      }
    }
  }

  public clearTextSearch(): void {
    const textsearchcloseElement = document.getElementById(
      'container_close_search_box-icon'
    ) as HTMLElement;
    const textsearchElement = document.getElementById(
      'container_search_box-icon'
    ) as HTMLElement;
    textsearchcloseElement.style.display = 'none';
    textsearchElement.style.display = 'block';
    if(this.pdfviewerControl)
    this.pdfviewerControl.textSearchModule.cancelTextSearch();
    const searchTextElement = document.getElementById(
      'container_search_input'
    ) as HTMLInputElement;
    searchTextElement.value = '';
  }

  public previousTextSearch(): void {
    if(this.pdfviewerControl)
    this.pdfviewerControl.textSearchModule.searchPrevious();
  }

  public nextTextSearch(): void {
    if(this.pdfviewerControl)
    this.pdfviewerControl.textSearchModule.searchNext();
  }

  public checkBoxChanged(event: Event): void {
    const target = event.target as HTMLInputElement;

    if (target.checked) {
      const matchcaseElement = document.getElementById(
        'container_match_case'
      ) as HTMLInputElement;
      if (matchcaseElement) {
        matchcaseElement.checked = true;
      }
      this.matchCase = true;
      const checkboxSpanElement = document.getElementById('checkboxSpan');
      if (checkboxSpanElement) {
        checkboxSpanElement.classList.add('e-check');
      }
    } else {
      this.matchCase = false;
      const checkboxSpanElement = document.getElementById('checkboxSpan');
      if (checkboxSpanElement) {
        checkboxSpanElement.classList.remove('e-check');
      }
    }
  }
}
