import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PdfViewerUi } from './pdf-viewer-ui';

describe('PdfViewerUi', () => {
  let component: PdfViewerUi;
  let fixture: ComponentFixture<PdfViewerUi>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PdfViewerUi],
    }).compileComponents();

    fixture = TestBed.createComponent(PdfViewerUi);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
