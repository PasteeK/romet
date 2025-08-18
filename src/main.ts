import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

bootstrapApplication(App, appConfig)
  .then(appRef => {
    (window as any).ngInjector = appRef.injector;
  })
  .catch((err) => console.error(err));
