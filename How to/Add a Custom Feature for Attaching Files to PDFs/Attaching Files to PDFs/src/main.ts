import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';

import { registerLicense } from '@syncfusion/ej2-base';
// Registering Syncfusion license key
registerLicense('ORg4AjUWIQA/Gnt2UlhiQlBPd11dXmJWd1p/THNYflR1fV9DaUwxOX1dQl9nSH9TcEVrXHhbcnBXT2Q=');

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error(err));
