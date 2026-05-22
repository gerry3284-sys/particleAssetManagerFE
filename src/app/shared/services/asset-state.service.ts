import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Subject } from 'rxjs';

export type AssetStateChangeEvent = {
  type: 'working' | 'available' | 'maintenance' | 'return' | 'dismiss' | 'edit';
  assetCode: string;
};

@Injectable({
  providedIn: 'root'
})
export class AssetStateService {
  private readonly platformId = inject(PLATFORM_ID);
  private assetStateChanged$ = new Subject<AssetStateChangeEvent>();
  private ticketsChanged$ = new Subject<void>();

  assetStateChanged = this.assetStateChanged$.asObservable();
  ticketsChanged = this.ticketsChanged$.asObservable();

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      window.addEventListener('storage', (event) => {
        if (event.key === 'tickets-changed') {
          this.ticketsChanged$.next();
        }
        if (event.key === 'asset-state-changed' && event.newValue) {
          this.assetStateChanged$.next(JSON.parse(event.newValue));
        }
      });
    }
  }

  notifyAssetStateChanged(event: AssetStateChangeEvent): void {
    this.assetStateChanged$.next(event);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('asset-state-changed', JSON.stringify(event));
      localStorage.removeItem('asset-state-changed');
    }
  }

  notifyTicketsChanged(): void {
    this.ticketsChanged$.next();
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('tickets-changed', Date.now().toString());
      localStorage.removeItem('tickets-changed');
    }
  }
}