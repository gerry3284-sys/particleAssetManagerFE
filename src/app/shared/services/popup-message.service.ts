import { Injectable, signal } from '@angular/core';

export type PopupMessageType = 'success' | 'error';

export interface PopupMessageState {
  type: PopupMessageType;
  text: string;
}

@Injectable({
  providedIn: 'root'
})
export class PopupMessageService {
  readonly message = signal<PopupMessageState | null>(null);

  private hideTimer: ReturnType<typeof setTimeout> | null = null;

  show(type: PopupMessageType, text: string, durationMs = 4200): void {
    this.message.set({ type, text });

    if (this.hideTimer) {
      clearTimeout(this.hideTimer);
    }

    this.hideTimer = setTimeout(() => {
      this.message.set(null);
      this.hideTimer = null;
    }, durationMs);
  }

  success(text: string, durationMs?: number): void {
    this.show('success', text, durationMs);
  }

  error(text: string, durationMs?: number): void {
    this.show('error', text, durationMs);
  }

  dismiss(): void {
    if (this.hideTimer) {
      clearTimeout(this.hideTimer);
      this.hideTimer = null;
    }
    this.message.set(null);
  }
}
