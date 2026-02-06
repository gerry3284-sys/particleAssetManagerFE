import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Asset } from '../models/asset.interface';

// Modello backend
export interface AssetApi {
  status: string;
  brand: string;
  model: string;
  serialNumber: string;
  assignedUser: string;
  businessUnit: string;
  assignmentDate: string;
  assetType?: string;
}

// Modello frontend tipizzato

@Injectable({
  providedIn: 'root' //  disponibile ovunque senza dover importare manualmente
})
export class AssetService {

  private readonly apiUrl = 'http://localhost:8080/asset/list';

  constructor(private readonly http: HttpClient) {}

  getAssets(): Observable<Asset[]> {
    return this.http.get<AssetApi[]>(this.apiUrl).pipe(
      map((data) => data.map((item, index) => this.mapAsset(item, index)))
    );
  }

  private mapAsset(item: AssetApi, index: number): Asset {
    const status = item.status as Asset['status'];

    return {
      id: String(index + 1), // temporaneo finché il backend non restituisce id
      status,
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
}
