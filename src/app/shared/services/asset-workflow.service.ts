import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AssetDetail } from '../models/asset.interface';
import { AssetService } from './asset.service';

export interface ReturnAssetCommand {
  notes?: string;
  userId: number;
}

export interface DismissAssetCommand {
  reason: string;
  reasonLabel: string;
  notes: string;
  userId: number;
}

@Injectable({
  providedIn: 'root'
})
export class AssetWorkflowService {
  constructor(private readonly assetService: AssetService) {}

  assignAsset(asset: AssetDetail, payload: { userId: number; notes?: string }): Observable<void> {
    // Il backend aggiorna automaticamente lo status_code in base al movementType.
    return this.assetService.createAssetMovement(asset.assetCode, {
      note: payload.notes || ' ',
      movementType: 'Assigned',
      user: payload.userId
    });
  }

  certifyReturn(asset: AssetDetail, payload: ReturnAssetCommand): Observable<void> {
    const safeNote = payload.notes?.trim() || 'Riconsegna certificata';

    return this.assetService.createAssetMovement(asset.assetCode, {
      note: safeNote,
      movementType: 'Returned',
      user: payload.userId
    });
  }

  dismissAsset(asset: AssetDetail, payload: DismissAssetCommand): Observable<void> {
    return this.assetService.createAssetMovement(asset.assetCode, {
      note: `${payload.reasonLabel}: ${payload.notes}`,
      movementType: 'Dismissed',
      user: payload.userId
    });
  }
}
