import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../features/environment';
import {MovementByuserID, User } from '../models/user.model';
import { AssetType } from '../shared/services/asset-type.service';
import { BusinessUnit } from '../shared/services/business-unit.service';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.baseUrl}/user`);
  }
  getUsersById(id: number): Observable<User> {
    return this.http.get<User>(`${this.baseUrl}/user/${id}`);
  }
  getMovementByUserId(id: number): Observable<MovementByuserID[]>{
    return this.http.get<MovementByuserID[]>(`${this.baseUrl}/user/${id}/movement`);
  }
  getAssetTypes(): Observable<AssetType[]>{
    return this.http.get<AssetType[]>(`${this.baseUrl}/assetType`);
  }
  getBusinessUnits(): Observable<BusinessUnit[]>{
    return this.http.get<BusinessUnit[]>(`${this.baseUrl}/businessUnit`);
  }
  getReceiptByAssetAndMovement(code: string, id: number): Observable<any>{
    return this.http.get(`${this.baseUrl}/asset/${code}/movement/${id}/receipt`, { responseType: 'blob' });
  }
  putAssetTypeById(code: string, assetType: Object): Observable<any>{
    return this.http.put(`${this.baseUrl}/assetType/${code}`, assetType, { responseType: 'text' });
  }
  putAssetActiveChangeById(code: string, assetType: Object): Observable<any>{
    return this.http.put(`${this.baseUrl}/assetType/activateDeactivate/${code}`, assetType, { responseType: 'text' })
  }
  putBusinessUnitById(code:string, businessUnit: Object): Observable<any>{
    return this.http.put(`${this.baseUrl}/businessUnit/${code}`, businessUnit, { responseType: 'text' });
  }
  putBusinessActiveChangeById(code: string, businessUnit: Object): Observable<any>{
    return this.http.put(`${this.baseUrl}/businessUnit/activateDeactivate/${code}`, businessUnit, { responseType: 'text' })
  }
  postAssetType(assetType: Object): Observable<any>{
    return this.http.post(`${this.baseUrl}/assetType`, assetType, { responseType: 'text' });
  }
  postBusinessUnit(businessUnit: Object): Observable<any>{
    return this.http.post(`${this.baseUrl}/businessUnit`, businessUnit, { responseType: 'text' });
  }
}