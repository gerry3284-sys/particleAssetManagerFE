import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

if (typeof document !== 'undefined') {
  const themeStorageKey = 'pam-theme';
  const savedTheme = typeof localStorage !== 'undefined'
    ? localStorage.getItem(themeStorageKey)
    : null;

  document.body.classList.toggle('theme-dark', savedTheme === 'dark');
}

bootstrapApplication(App, appConfig)
  .catch(err => console.error(err));