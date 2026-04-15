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
  hardDisk?: string | null;
  ram?: number | null;
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
  id?: number;
  code?: string;
  date: string;
  movementType: string;
  note: string | null;
  receipt?: string | null;
  receiptBase64?: string | null;
  receiptAvailable?: boolean | null;
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
    const safeCode = this.toSafeAssetCode(assetCode);
    return this.http.get<AssetDetailApi>(`${this.apiUrl}/${safeCode}`).pipe(
      map(item => this.mapAssetDetail(item))
    );
  }

  // MOVIMENTI ASSET
  getAssetMovements(assetCode: string): Observable<AssetMovement[]> {
    const safeCode = this.toSafeAssetCode(assetCode);
    return this.http.get<AssetMovementApi[]>(`${this.apiUrl}/${safeCode}/movement`).pipe(
      map(items =>
        [...items]
          .sort((a, b) => this.toMovementTimestamp(b) - this.toMovementTimestamp(a))
          .map(item => this.mapAssetMovement(item))
      )
    );
  }

  // RICEVUTA MOVIMENTO
  getMovementReceipt(assetCode: string, movementId: string): Observable<Blob> {
    const safeCode = this.toSafeAssetCode(assetCode);
    const safeMovementId = encodeURIComponent((movementId ?? '').trim());
    return this.http.get(`${this.apiUrl}/${safeCode}/movement/${safeMovementId}/receipt`, {
      responseType: 'blob'
    });
  }

  private toMovementTimestamp(movement: AssetMovementApi): number {
    const parsed = Date.parse(movement.date);
    if (Number.isFinite(parsed)) {
      return parsed;
    }

    // Fallback stabile se il backend invia una data non parseabile.
    return Number(movement.id) || 0;
  }

  // CREA MOVIMENTO ASSET
  createAssetMovement(assetCode: string, payload: {
    note: string;
    movementType: string;
    user: number | null;
    receiptBase64?: string;
    recipientEmail?: string;
  }): Observable<void> {
    const safeCode = this.toSafeAssetCode(assetCode);
    const rawMovementType = (payload.movementType ?? '').trim();
    const normalizedMovementType = rawMovementType.toUpperCase();
    // Costruisce body senza receiptBase64 se non fornito
    const body: Record<string, unknown> = {
      note: payload.note,
      movementType: normalizedMovementType || rawMovementType,
      user: payload.user
    };
    const normalizedReceiptBase64 = this.normalizeReceiptBase64(payload.receiptBase64);
    if (normalizedReceiptBase64 !== undefined) {
      body['receiptBase64'] = normalizedReceiptBase64;
    }
    if (payload.recipientEmail) {
      body['recipientEmail'] = payload.recipientEmail;
    }
    return this.http.post<void>(`${this.apiUrl}/${safeCode}/movement`, body);
  }

  private normalizeReceiptBase64(value?: string): string | undefined {
    const raw = (value ?? '').trim();
    if (!raw) {
      return undefined;
    }

    const splitIndex = raw.indexOf(',');
    const base64Part = splitIndex >= 0 ? raw.slice(splitIndex + 1) : raw;
    const normalized = base64Part.replace(/\s+/g, '');
    return normalized || undefined;
  }

  // AGGIORNA ASSET
  updateAsset(assetCode: string, payload: {
    brand: string;
    model: string;
    serialNumber: string;
    note: string;
    hardDisk: string;
    businessUnitCode: string;
    assetTypeCode: string;
    ram: number;
  }): Observable<void> {
    const safeCode = this.toSafeAssetCode(assetCode);
    return this.http.put<void>(`${this.apiUrl}/${safeCode}`, payload);
  }

  // AGGIORNA SOLO LO STATUS ASSET (nuovo endpoint backend)
  updateAssetStatus(assetCode: string, assetStatusTypeCode: string): Observable<void> {
    const safeCode = this.toSafeAssetCode(assetCode);
    return this.http.put<void>(`${this.apiUrl}/updateAssetStatus/${safeCode}`, {
      assetStatusTypeCode
    });
  }

  // Normalizza il codice prima di usarlo in URL.
  // Evita 404/400 dovuti a spazi accidentali in route o binding.
  private toSafeAssetCode(assetCode: string): string {
    return encodeURIComponent((assetCode ?? '').trim());
  }

  // CREA ASSET
  createAsset(payload: {
    brand: string;
    model: string;
    serialNumber: string;
    note: string;
    hardDisk: string;
    businessUnitCode: string;
    assetTypeCode: string;
    ram: number;
  }): Observable<void> {
    return this.http.post<void>(this.apiUrl, payload);
  }

  // MAPPA ASSET LISTA → FRONTEND
  private mapAsset(item: AssetApi): Asset {
    const status = this.parseStatus(item.status);

    return {
      id: item.assetCode,   
      assetCode: item.assetCode,
      status,
      statusLabel: this.toItalianStatusLabel(status),
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
    // Usa prima code per la logica (piu affidabile), name solo come fallback/UI.
    const status = this.parseStatus(item.assetStatusType.code, item.assetStatusType.name);

    return {
      id: item.code,
      assetCode: item.code,
      businessUnit: item.businessUnit.name,
      businessUnitCode: item.businessUnit.code,
      brand: item.brand,
      model: item.model,
      serialNumber: item.serialNumber,
      hardDisk: item.hardDisk ?? null,
      ram: item.ram ?? null,
      assignedUser: null,
      assignedUserId: null,
      assignmentDate: null,
      returnDate: null,
      notes: item.note ?? '-',
      status,
      statusLabel: this.toItalianStatusLabel(status),
      assetType: item.assetType.name,
      assetTypeCode: item.assetType.code,
      assetStatusTypeCode: item.assetStatusType.code,
      movements: []
    };
  }

  private mapAssetMovement(item: AssetMovementApi): AssetMovement {
    const sanitizedNote = item.note?.trim();
    const movementType = this.normalizeMovementType(item.movementType);
    const receiptAvailable = this.parseReceiptAvailability(item);
    const movementCode = this.resolveMovementCode(item);

    return {
      id: movementCode,
      date: new Date(item.date).toLocaleDateString(),
      user: `${item.user.name} ${item.user.surname}`,
      userId: String(item.user.id),
      movementType,
      movementLabel: this.getMovementLabel(movementType),
      note: sanitizedNote ? sanitizedNote : undefined,
      receiptAvailable
    };
  }

  private resolveMovementCode(item: AssetMovementApi): string {
    const code = (item.code ?? '').trim();
    if (code) {
      return code;
    }

    const numericId = Number(item.id);
    if (Number.isFinite(numericId)) {
      return String(numericId);
    }

    return '';
  }

  private parseReceiptAvailability(item: AssetMovementApi): boolean | undefined {
    if (typeof item.receiptAvailable === 'boolean') {
      return item.receiptAvailable;
    }

    if (typeof item.receiptBase64 === 'string') {
      return item.receiptBase64.trim().length > 0;
    }

    if (typeof item.receipt === 'string') {
      return item.receipt.trim().length > 0;
    }

    return undefined;
  }

  private normalizeMovementType(type: string | null | undefined): AssetMovement['movementType'] {
    const normalized = (type ?? '').trim().toUpperCase();

    switch (normalized) {
      case 'ASSIGNED':
        return 'Assigned';
      case 'RETURNED':
        return 'Returned';
      case 'DISMISSED':
        return 'Dismissed';
      default:
        return 'Assigned';
    }
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
  private parseStatus(primary?: string | null, fallback?: string | null): Asset['status'] {
    const candidates = [primary, fallback]
      .filter((value): value is string => !!value)
      .map(value => value.trim())
      .filter(Boolean);

    if (!candidates.length) {
      return 'Unavailable';
    }

    for (const candidate of candidates) {
      const normalized = candidate
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '');

      // Code brevi backend (AS*, AV*, DI*)
      if (normalized.startsWith('AS')) {
        return 'Assigned';
      }

      if (normalized.startsWith('AV')) {
        return 'Available';
      }

      if (normalized.startsWith('DI')) {
        return 'Dismissed';
      }

      // Label complete EN/IT
      if (normalized.includes('ASSIGN') || normalized.includes('ASSEGN')) {
        return 'Assigned';
      }

      if (normalized.includes('DISMISS') || normalized.includes('DISMESS')) {
        return 'Dismissed';
      }

      if (normalized.includes('AVAIL') || normalized.includes('DISPONIBIL')) {
        return 'Available';
      }
    }

    // Stati speciali (es. Under Maintenance) non consentono movimenti.
    return 'Unavailable';
  }

  private toItalianStatusLabel(status: Asset['status']): string {
    switch (status) {
      case 'Assigned':
        return 'Assegnato';
      case 'Available':
        return 'Disponibile';
      case 'Dismissed':
        return 'Dismesso';
      case 'Unavailable':
      default:
        return 'Non disponibile';
    }
  }
}
