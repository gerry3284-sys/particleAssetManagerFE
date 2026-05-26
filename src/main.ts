import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

if (typeof document !== 'undefined') {
  const themeStorageKey = 'pam-theme';
  let savedTheme: string | null = null;
  try {
    if (typeof localStorage !== 'undefined') {
      savedTheme = localStorage.getItem(themeStorageKey);
    }
  } catch (e) {
    savedTheme = null;
  }

  let isDark = savedTheme === 'dark';
  if (savedTheme === null && typeof window !== 'undefined' && window.matchMedia) {
    isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  document.body.classList.toggle('theme-dark', isDark);
}

bootstrapApplication(App, appConfig)
  .catch(err => console.error(err));