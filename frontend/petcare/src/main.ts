import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { configureLeafletIcons } from './app/core/map/leaflet-icons';

configureLeafletIcons();

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
