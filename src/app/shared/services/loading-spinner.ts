import { Component } from '@angular/core';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  template: `
    <div class="loading-overlay">
      <div class="spinner"></div>
      <p class="loading-text">Caricamento in corso...</p>
    </div>
  `,
  styles: [`
    .loading-overlay {
      position: fixed;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 1rem;
      background-color: var(--bg-page, #FFFFFF);
      z-index: 9999;
    }
    .spinner {
      width: 48px;
      height: 48px;
      border: 4px solid var(--border, #F3F4F6);
      border-top-color: var(--accent, #E56A3D);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    .loading-text {
      font-size: 14px;
      color: var(--text-mid, #6B7280);
      font-weight: 500;
      margin: 0;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class LoadingSpinnerComponent {}