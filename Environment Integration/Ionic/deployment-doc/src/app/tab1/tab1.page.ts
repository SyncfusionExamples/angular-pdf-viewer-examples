import { Component } from '@angular/core';
import { PdfViewerComponent } from '../components/pdf-viewer/pdf-viewer.component';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  imports: [PdfViewerComponent],
  standalone: true
})
export class Tab1Page {
  constructor() {}
}
