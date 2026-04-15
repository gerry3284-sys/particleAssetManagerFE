import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AssetDetail } from '../models/asset.interface';
import { AssetService } from './asset.service';

export interface AssignAssetCommand {
  userId: number;
  notes?: string;
  receiptBase64?: string;
}

export interface ReturnAssetCommand {
  reason: 'resignation' | 'change';
  privateEmail?: string;
  receiptBase64?: string;
  notes?: string;
  userId: number;
}

export interface DismissAssetCommand {
  reason: string;
  reasonLabel: string;
  notes: string;
  userId: number | null;
  receiptBase64?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AssetWorkflowService {
  constructor(private readonly assetService: AssetService) {}

  assignAsset(asset: AssetDetail, payload: AssignAssetCommand): Observable<void> {
    // Il backend aggiorna automaticamente lo status_code in base al movementType.
    return this.assetService.createAssetMovement(asset.assetCode, {
      note: payload.notes?.trim() || 'Assegnazione asset',
      movementType: 'Assigned',
      user: payload.userId,
      receiptBase64: payload.receiptBase64
    });
  }

  certifyReturn(asset: AssetDetail, payload: ReturnAssetCommand): Observable<void> {
    const safeNote = payload.notes?.trim() || 'Riconsegna certificata';

    return this.assetService.createAssetMovement(asset.assetCode, {
      note: safeNote,
      movementType: 'Returned',
      user: payload.userId,
      receiptBase64: payload.receiptBase64,
      recipientEmail: payload.privateEmail
    });
  }

  dismissAsset(asset: AssetDetail, payload: DismissAssetCommand): Observable<void> {
    return this.assetService.createAssetMovement(asset.assetCode, {
      note: `${payload.reasonLabel}: ${payload.notes}`,
      movementType: 'Dismissed',
      user: null,
      receiptBase64: payload.receiptBase64
    });
  }
}
