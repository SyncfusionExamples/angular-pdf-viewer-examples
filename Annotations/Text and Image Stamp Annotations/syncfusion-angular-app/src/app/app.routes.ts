import { Routes } from '@angular/router';
import { HomeComponent } from '../components/home/home.component';
import { PDFViewerComponent } from '../components/pdf-viewer/pdf-viewer.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'pdf-viewer', component: PDFViewerComponent },
  { path: '**', redirectTo: '' }
];