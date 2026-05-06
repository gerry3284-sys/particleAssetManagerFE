import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export type AssetStateChangeEvent = {
  type: 'maintenance' | 'return' | 'dismiss' | 'edit';
  assetCode: string;
};

@Injectable({
  providedIn: 'root'
})
export class AssetStateService {
  private assetStateChanged$ = new Subject<AssetStateChangeEvent>();

  assetStateChanged = this.assetStateChanged$.asObservable();

  notifyAssetStateChanged(event: AssetStateChangeEvent): void {
    this.assetStateChanged$.next(event);
  }
}
