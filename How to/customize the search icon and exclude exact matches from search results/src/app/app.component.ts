import { Component, OnInit } from '@angular/core';
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
  PageOrganizerService,
  CustomToolbarItemModel,
} from '@syncfusion/ej2-angular-pdfviewer';

@Component({
  selector: 'app-root',
  // specifies the template string for the PDF Viewer component
  template: `<div class="content-wrapper">
  <ejs-pdfviewer
      #pdfviewer
      id="pdfViewer"
      [documentPath]="document"
      [resourceUrl]="resource"
      [toolbarSettings]="toolbarSettings"
      (toolbarClick)="toolbarClick($event)"
      style="height:640px;display:block"
    ></ejs-pdfviewer>
</div>
<div id="textSearchToolbar" [style.display]="'none'">
    <div
      class="e-pv-search-bar"
      id="container_search_box"
      [style.top]="'60px'"
      [style.right]="'70px'"
      [style.height]="'70px'"
      [style.width]="'300px'"
    >
      <div class="e-pv-search-bar-elements" id="container_search_box_elements">
        <div
          class="e-input-group e-pv-search-input"
          id="container_search_input_container"
        >
          <input
            class="e-input"
            id="container_search_input"
            type="text"
            placeholder="Find in document"
            (keypress)="searchInputKeypressed($event)"
            (input)="inputChange()"
          />
          <span
            class="e-input-group-icon e-input-search-group-icon e-icons e-search"
            id="container_search_box-icon"
            style="top: 4px;"
            (click)="initiateTextSearch()"
          ></span>
          <span
            class="e-input-group-icon e-input-search-group-icon e-icons e-close"
            id="container_close_search_box-icon"
            [style.display]="'none'"
            style="top: 4px;"
            (click)="clearTextSearch()"
          ></span>
        </div>
        <button
          class="e-btn e-icon-btn e-pv-search-btn e-icons e-chevron-left"
          id="container_prev_occurrence"
          (click)="previousTextSearch()"
          type="button"
          [disabled]="true"
          aria-label="Previous Search text"
        ></button>
        <button
          class="e-btn e-icon-btn e-pv-search-btn e-icons e-chevron-right"
          id="container_next_occurrence"
          type="button"
          (click)="nextTextSearch()"
          [disabled]="true"
          aria-label="Next Search text"
        ></button>
      </div>
      <div
        class="e-pv-match-case-container"
        id="container_match_case_container"
      >
        <div class="e-checkbox-wrapper e-wrapper e-pv-match-case">
          <label for="container_match_case">
            <input
              id="container_match_case"
              type="checkbox"
              class="e-control e-checkbox e-lib"
              (click)="checkBoxChanged($event)"
            />
            <span class="e-ripple-container" data-ripple="true"></span>
            <span id="checkboxSpan" class="e-icons e-frame"></span>
            <span class="e-label">Match case</span>
          </label>
        </div>
      </div>
    </div>
  </div>`,
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
    PrintService,
    PageOrganizerService]
})
export class AppComponent implements OnInit {
  public document = 'https://cdn.syncfusion.com/content/pdf/pdf-succinctly.pdf';
  public resource: string = 'https://cdn.syncfusion.com/ej2/27.1.48/dist/ej2-pdfviewer-lib';;
  ngOnInit(): void {
  }

  public matchCase = false;
  public searchActive = false;
  public toolItem4: CustomToolbarItemModel = {
    prefixIcon: 'e-icons e-search',
    tooltipText: 'Find Text',
    id: 'find_text',
    align: 'Right',
  };
  public toolbarSettings = {
    showTooltip: true,
    toolbarItems: [
      'OpenOption',
      'PageNavigationTool',
      'MagnificationTool',
      'PanTool',
      'SelectionTool',
      this.toolItem4,
      'PrintOption',
      'DownloadOption',
      'UndoRedoTool',
      'AnnotationEditTool',
      'FormDesignerEditTool',
      'CommentTool',
      'SubmitForm',
    ],
  };
  public searchInputKeypressed(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.initiateTextSearch();
    }
  }
  public searchText: string = '';
  public prevMatchCase = false;
  public initiateTextSearch(): void {
    var pdfviewer = (<any>document.getElementById("pdfViewer")).ej2_instances[0];
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
        pdfviewer.textSearchModule.cancelTextSearch();
        this.searchText = (
          document.getElementById('container_search_input') as HTMLInputElement
        ).value;
        this.searchActive = true;
        pdfviewer.textSearchModule.searchText(
          this.searchText,
          this.matchCase
        );
        this.prevMatchCase = this.matchCase;
      } else {
        this.nextTextSearch();
      }
    }
  }
  public nextTextSearch(): void {
    var pdfviewer = (<any>document.getElementById("pdfViewer")).ej2_instances[0];
    pdfviewer.textSearchModule.searchNext();
    this.searchActive = true;
  }

  public previousTextSearch(): void {
    var pdfviewer = (<any>document.getElementById("pdfViewer")).ej2_instances[0];
    pdfviewer.textSearchModule.searchPrevious();
    this.searchActive = true;
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

  public clearTextSearch(): void {
    var pdfviewer = (<any>document.getElementById("pdfViewer")).ej2_instances[0];
    const textsearchcloseElement = document.getElementById(
      'container_close_search_box-icon'
    ) as HTMLElement;
    const textsearchElement = document.getElementById(
      'container_search_box-icon'
    ) as HTMLElement;
    textsearchcloseElement.style.display = 'none';
    textsearchElement.style.display = 'block';
    pdfviewer.textSearchModule.cancelTextSearch();
    const searchTextElement = document.getElementById(
      'container_search_input'
    ) as HTMLInputElement;
    searchTextElement.value = '';
    (
      document.getElementById('container_prev_occurrence') as HTMLButtonElement
    ).disabled = true;
    (
      document.getElementById('container_next_occurrence') as HTMLButtonElement
    ).disabled = true;
  }

  public inputChange(): void {
    var pdfviewer = (<any>document.getElementById("pdfViewer")).ej2_instances[0];
    pdfviewer.textSearchModule.clearAllOccurrences();
    this.searchActive = false;
    if (
      (document.getElementById('container_search_input') as HTMLInputElement)
        .value == ''
    ) {
      const textsearchcloseElement = document.getElementById(
        'container_close_search_box-icon'
      ) as HTMLElement;
      const textsearchElement = document.getElementById(
        'container_search_box-icon'
      ) as HTMLElement;
      textsearchcloseElement.style.display = 'none';
      textsearchElement.style.display = 'block';
      (
        document.getElementById(
          'container_prev_occurrence'
        ) as HTMLButtonElement
      ).disabled = true;
      (
        document.getElementById(
          'container_next_occurrence'
        ) as HTMLButtonElement
      ).disabled = true;
    } else {
      (
        document.getElementById(
          'container_prev_occurrence'
        ) as HTMLButtonElement
      ).disabled = false;
      (
        document.getElementById(
          'container_next_occurrence'
        ) as HTMLButtonElement
      ).disabled = false;
    }
  }

  public toolbarClick(args: any): void {
    console.log(args);
    if (args.item && args.item.id === 'find_text') {
      const toolbarElement = document.getElementById("textSearchToolbar");
    if (toolbarElement) {
      if (toolbarElement.style.display === 'block') {
        toolbarElement.style.display = 'none';
      } else {
        toolbarElement.style.display = 'block';
      }
    }
    }
  }
}