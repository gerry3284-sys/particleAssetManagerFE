// src/app/services/filter.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { shareReplay } from 'rxjs/operators';
import { User, AssetType, BusinessUnit, AssetStatusType, FilterValues } from '../models/filter-config.interface';


@Injectable({
  providedIn: 'root', // disponibile in tutta l'app
})
export class FilterService {
  private readonly http = inject(HttpClient);
  private assetStatusTypes$: Observable<AssetStatusType[]> | null = null;

  getUsers(): Observable<User[]> {
    return this.http.get<User[]>('http://localhost:8080/user');
  }

  getAssetTypes(): Observable<AssetType[]> {
    return this.http.get<AssetType[]>('http://localhost:8080/assetType');
  }

  getBusinessUnits(): Observable<BusinessUnit[]> {
    return this.http.get<BusinessUnit[]>('http://localhost:8080/businessUnit');
  }

  getAssetStatusTypes(forceRefresh = false): Observable<AssetStatusType[]> {
    if (forceRefresh || !this.assetStatusTypes$) {
      this.assetStatusTypes$ = this.http
        .get<AssetStatusType[]>('http://localhost:8080/assetStatusType')
        .pipe(shareReplay(1));
    }
    return this.assetStatusTypes$;
  }

  createAssetStatusType(payload: { name: string }): Observable<void> {
    return this.http.post<void>('http://localhost:8080/assetStatusType', payload).pipe(
      tap(() => this.invalidateAssetStatusTypesCache())
    );
  }

  updateAssetStatusType(code: string, payload: { name: string }): Observable<void> {
    const safeCode = encodeURIComponent((code ?? '').trim());
    return this.http.put<void>(`http://localhost:8080/assetStatusType/${safeCode}`, payload).pipe(
      tap(() => this.invalidateAssetStatusTypesCache())
    );
  }

  private invalidateAssetStatusTypesCache(): void {
    this.assetStatusTypes$ = null;
  }
}
