import { Component, ViewEncapsulation, OnInit, ViewChild } from '@angular/core';
import { PdfViewerComponent, LinkAnnotationService, BookmarkViewService, MagnificationService, ThumbnailViewService, ToolbarService, NavigationService, TextSearchService, TextSelectionService, PrintService, AnnotationService, FormFieldsService, FormDesignerService, PageOrganizerService } from '@syncfusion/ej2-angular-pdfviewer';
import { DialogComponent } from '@syncfusion/ej2-angular-popups';
import { AnimationSettingsModel } from '@syncfusion/ej2-splitbuttons';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
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
    AnnotationService,
    FormFieldsService,
    FormDesignerService,
    PageOrganizerService
  ],
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  public title: string = 'PDF Viewer Application';

  @ViewChild('pdfviewer')
  public pdfviewerControl!: PdfViewerComponent;
  
  @ViewChild('Dialog')
  public Dialog!: DialogComponent;
  
  public userName: string = '';
  public password: string = '';
  public isAuthenticated: boolean = false;
  public authError: string = '';
  public base64Strings: any;
  public document: string = 'https://cdn.syncfusion.com/content/pdf/pdf-succinctly.pdf';
  public resourceUrl: string = "https://cdn.syncfusion.com/ej2/30.1.37/dist/ej2-pdfviewer-lib";
  
  // Mock user credentials - in a real app, these would be stored securely
  private validUsers = [
    { username: 'UserA', password: 'admin123' },
    { username: 'UserB', password: 'user123' }
  ];

  ngOnInit(): void {
    // Check if user was previously authenticated in this session
    const savedAuth = sessionStorage.getItem('pdfViewerAuthenticated');
    if (savedAuth === 'true') {
      this.isAuthenticated = true;
      const savedUser = sessionStorage.getItem('pdfViewerUser');
      if (savedUser) {
        this.userName = savedUser;
      }
    }
  }

  // Validates user credentials and opens PDF viewer if successful
  authenticate() {
    // Reset error message
    this.authError = '';
    
    // Check if username and password are provided
    if (!this.userName || !this.password) {
      this.authError = 'Please enter both username and password';
      return;
    }
    
    // Find matching user
    const user = this.validUsers.find(
      u => u.username === this.userName && u.password === this.password
    );
    
    if (user) {
      this.isAuthenticated = true;
      // Store authentication state in session
      sessionStorage.setItem('pdfViewerAuthenticated', 'true');
      sessionStorage.setItem('pdfViewerUser', this.userName);
      
      // Open PDF Viewer with the authenticated user
      this.openPDFViewer();
    } else {
      this.authError = 'Invalid username or password';
      this.isAuthenticated = false;
    }
  }

  // Clears user session and hides PDF viewer
  logout() {
    this.isAuthenticated = false;
    this.userName = '';
    this.password = '';
    sessionStorage.removeItem('pdfViewerAuthenticated');
    sessionStorage.removeItem('pdfViewerUser');
    
    // Close dialog if open
    if (this.Dialog && this.Dialog.visible) {
      this.Dialog.hide();
    }
  }

  // Shows PDF viewer dialog and loads document after authentication check
  openPDFViewer() {
    if (!this.isAuthenticated) {
      this.authError = 'Authentication required!';
      return;
    }
    
    // Set the current user as the author for annotations
    if (this.pdfviewerControl) {
      this.pdfviewerControl.annotationSettings.author = this.userName;
    }
    this.Dialog.show();
    if(this.base64Strings!=undefined)
      this.pdfviewerControl.load(this.base64Strings, '');
    else
      this.pdfviewerControl.load(this.document, '');
  }

  // Dialog configuration properties
  public header: string = 'PDF Viewer';
  public showCloseIcon: Boolean = true;
  public width: string = '100%';
  public height: string = '90%';
  public animationSettings: AnimationSettingsModel = { effect: 'None' };
  public target: string = '.content-wrapper';
  
  // Saves PDF state as base64 on dialog close
  public dialogClose = (): void => {
    if (this.pdfviewerControl) {
      this.pdfviewerControl.saveAsBlob().then((value) => {
        const data = value;
        const reader = new FileReader();
        reader.readAsDataURL(data);
        reader.onload = () => {
          this.base64Strings = reader.result;
        };
      }).catch(error => {
        console.error('Error saving PDF:', error);
      });
    }
  }
  
  // Loads saved PDF data when dialog opens
  public dialogOpen = (): void => {
    if (this.base64Strings && this.pdfviewerControl) {
      this.pdfviewerControl.load(this.base64Strings, '');
    }
  }

}



