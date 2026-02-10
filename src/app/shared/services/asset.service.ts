import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Asset, AssetDetail, AssetMovement } from '../models/asset.interface';

// MODELLO BACKEND LISTA
export interface AssetApi {
  status: string;
  brand: string;
  model: string;
  serialNumber: string;
  assetCode: string;
  assignedUser: string;
  businessUnit: string;
  assignmentDate: string;
  assetType?: string;
}

// MODELLO BACKEND DETTAGLIO
export interface AssetDetailApi {
  id: number;
  brand: string;
  model: string;
  serialNumber: string;
  note: string | null;
  creationDate: string;
  updateDate: string | null;
  code: string;

  businessUnit: {
    id: number;
    name: string;
    code: string;
  };

  assetType: {
    id: number;
    name: string;
    code: string;
  };

  assetStatusType: {
    id: number;
    name: string;
    code: string;
  };
}

export interface AssetMovementApi {
  id: number;
  date: string;
  movementType: 'Assigned' | 'Returned' | 'Dismissed';
  note: string | null;
  user: {
    id: number;
    name: string;
    surname: string;
    email: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class AssetService {

  private readonly apiUrl = 'http://localhost:8080/asset';

  constructor(private readonly http: HttpClient) {}

  // LISTA ASSET
  getAssets(): Observable<Asset[]> {
    return this.http.get<AssetApi[]>(`${this.apiUrl}/list`).pipe(
      map(data => data.map(item => this.mapAsset(item)))
    );
  }

  // DETTAGLIO ASSET
  getAssetByCode(assetCode: string): Observable<AssetDetail> {
    const safeCode = encodeURIComponent(assetCode);
    return this.http.get<AssetDetailApi>(`${this.apiUrl}/${safeCode}`).pipe(
      map(item => this.mapAssetDetail(item))
    );
  }

  // MOVIMENTI ASSET
  getAssetMovements(assetCode: string): Observable<AssetMovement[]> {
    const safeCode = encodeURIComponent(assetCode);
    return this.http.get<AssetMovementApi[]>(`${this.apiUrl}/${safeCode}/movement`).pipe(
      map(items => items.map(item => this.mapAssetMovement(item)))
    );
  }

  // MAPPA ASSET LISTA → FRONTEND
  private mapAsset(item: AssetApi): Asset {
    return {
      id: item.assetCode,   
      assetCode: item.assetCode,
      status: this.parseStatus(item.status),
      statusLabel: item.status,
      brand: item.brand,
      model: item.model,
      serialNumber: item.serialNumber,
      assignedUser: item.assignedUser || '-',
      businessUnit: item.businessUnit || '-',
      assetType: item.assetType ?? '',
      assignmentDate: item.assignmentDate
        ? new Date(item.assignmentDate).toLocaleDateString()
        : '-'
    };
  }

  // MAPPA DETTAGLIO ASSET → FRONTEND
  private mapAssetDetail(item: AssetDetailApi): AssetDetail {
    const status = this.parseStatus(item.assetStatusType.name);

    return {
      id: item.code,
      assetCode: item.code,
      businessUnit: item.businessUnit.name,
      brand: item.brand,
      model: item.model,
      serialNumber: item.serialNumber,
      assignedUser: null,
      assignedUserId: null,
      assignmentDate: null,
      returnDate: null,
      notes: item.note ?? '-',
      status,
      statusLabel: item.assetStatusType.name,
      assetType: item.assetType.name,
      movements: []
    };
  }

  private mapAssetMovement(item: AssetMovementApi): AssetMovement {
    return {
      id: String(item.id),
      date: new Date(item.date).toLocaleDateString(),
      user: `${item.user.name} ${item.user.surname}`,
      userId: String(item.user.id),
      movementType: item.movementType,
      movementLabel: this.getMovementLabel(item.movementType),
      note: item.note ?? undefined
    };
  }

  private getMovementLabel(type: AssetMovement['movementType']): string {
    switch (type) {
      case 'Assigned':
        return 'Assegnato';
      case 'Returned':
        return 'Riconsegnato';
      case 'Dismissed':
        return 'Dismesso';
      default:
        return type;
    }
  }

  // NORMALIZZA STATUS
  private parseStatus(status: string): Asset['status'] {
    if (status === 'Assigned' || status === 'Available' || status === 'Dismissed') {
      return status;
    }
    return 'Available';
  }
}
