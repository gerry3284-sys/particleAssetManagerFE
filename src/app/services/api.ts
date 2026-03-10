import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../features/environment';
import { BusinessType, MovementByuserID, User } from '../models/user.model';
import { AssetType } from '../shared/services/asset-type.service';

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
  getBusinessUnitType(): Observable<BusinessType[]> {
    return this.http.get<BusinessType[]>(`${this.baseUrl}/businessUnit`);
  }
  getMovementByUserId(id: number): Observable<MovementByuserID[]>{
    return this.http.get<MovementByuserID[]>(`${this.baseUrl}/user/${id}/movement`);
  }
  getAssetTypes(): Observable<AssetType[]>{
    return this.http.get<AssetType[]>(`${this.baseUrl}/assetType`);
  }
  putAssetTypeById(code: string, assetType: Object): Observable<any>{
    return this.http.put(`${this.baseUrl}/assetType/${code}`, assetType, { responseType: 'text' });
  }
  putAssetActiveChangeById(code: string, assetType: Object): Observable<any>{
    return this.http.put(`${this.baseUrl}/assetType/activateDeactivate/${code}`, assetType, { responseType: 'text' })
  }
  postAssetType(assetType: Object): Observable<any>{
    return this.http.post(`${this.baseUrl}/assetType`, assetType, { responseType: 'text' });
  }
}