import { Component, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { ButtonComponent } from '../button/button';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, ButtonComponent],
  styleUrl: './sidebar.css',
  templateUrl: './sidebar.html',
})
export class SidebarComponent {
  private static readonly THEME_STORAGE_KEY = 'pam-theme';
  isDarkTheme = signal(false);

  constructor(private readonly router: Router) {
    this.syncThemeStateFromDom();
  }

  onLogout() {
    this.router.navigate(['/login']);
  }

  onToggleTheme(): void {
    if (typeof document === 'undefined') {
      return;
    }

    const nextIsDark = !this.isDarkTheme();
    document.body.classList.toggle('theme-dark', nextIsDark);
    this.isDarkTheme.set(nextIsDark);

    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(SidebarComponent.THEME_STORAGE_KEY, nextIsDark ? 'dark' : 'light');
    }
  }

  themeToggleLabel(): string {
    return this.isDarkTheme() ? 'Tema chiaro' : 'Tema scuro';
  }

  private syncThemeStateFromDom(): void {
    if (typeof document === 'undefined') {
      return;
    }

    this.isDarkTheme.set(document.body.classList.contains('theme-dark'));
  }

}
