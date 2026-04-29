import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PdfViewerComponent } from './pdf-viewer/pdf-viewer.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, PdfViewerComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('SSR');
}
