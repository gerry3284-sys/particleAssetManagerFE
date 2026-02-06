// src/app/services/filter.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User, AssetType, BusinessUnit, AssetStatusType, FilterValues } from '../models/filter-config.interface';


@Injectable({
  providedIn: 'root', // disponibile in tutta l'app
})
export class FilterService {
  constructor(private http: HttpClient) {}

  getUsers(): Observable<User[]> {
    return this.http.get<User[]>('http://localhost:8080/user');
  }

  getAssetTypes(): Observable<AssetType[]> {
    return this.http.get<AssetType[]>('http://localhost:8080/assetType');
  }

  getBusinessUnits(): Observable<BusinessUnit[]> {
    return this.http.get<BusinessUnit[]>('http://localhost:8080/businessUnit');
  }

  getAssetStatusTypes(): Observable<AssetStatusType[]> {
    return this.http.get<AssetStatusType[]>('http://localhost:8080/assetStatusType');
  }
}
