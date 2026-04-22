import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map, switchMap, take } from 'rxjs/operators';
import { AssetDetail } from '../models/asset.interface';
import { AssetService } from './asset.service';
import { FilterService } from './filter.service';
import { AssetStatusType } from '../models/filter-config.interface';

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
  constructor(
    private readonly assetService: AssetService,
    private readonly filterService: FilterService
  ) {}

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
    }).pipe(
      switchMap(() =>
        this.resolveUnderMaintenanceStatusCode().pipe(
          switchMap(statusCode => this.assetService.updateAssetStatus(asset.assetCode, statusCode))
        )
      )
    );
  }

  private resolveUnderMaintenanceStatusCode(): Observable<string> {
    return this.filterService.getAssetStatusTypes(true).pipe(
      take(1),
      map(statusTypes => {
        const explicitMaintenance = statusTypes.find(status => this.isUnderMaintenanceStatus(status));
        const fallbackFourth = statusTypes[3];
        const selectedCode = (explicitMaintenance?.code ?? fallbackFourth?.code ?? '').trim();

        if (!selectedCode) {
          throw new Error('Codice stato "Under Maintenance" non disponibile');
        }

        return selectedCode;
      })
    );
  }

  private isUnderMaintenanceStatus(status: AssetStatusType): boolean {
    const normalizedCode = (status.code ?? '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    const normalizedName = (status.name ?? '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');

    return normalizedCode.startsWith('UM')
      || normalizedCode.startsWith('MA')
      || normalizedName.includes('UNDERMAINT')
      || normalizedName.includes('MAINTEN')
      || normalizedName.includes('MANUTEN');
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
