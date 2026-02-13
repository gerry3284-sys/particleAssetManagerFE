import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../features/environment';
import { BusinessType, MovementByuserID, User } from '../models/user.model';

@Injectable({
  providedIn: 'root',
})
export class ApiService {

  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getUsers(): Observable<User[]> {
    console.log('API URL:', this.baseUrl);
    return this.http.get<User[]>(`${this.baseUrl}/user`);
  }
  getUsersById(id: number): Observable<User> {
    console.log('API URL:', this.baseUrl);
    return this.http.get<User>(`${this.baseUrl}/user/${id}`);
  }
  getBusinessUnitType(): Observable<BusinessType[]> {
    console.log('API URL:', this.baseUrl);
    return this.http.get<BusinessType[]>(`${this.baseUrl}/businessUnit`);
  }
  getMovementByUserId(id: number): Observable<MovementByuserID[]>{
    console.log('API URL:',`${this.baseUrl}/user/${id}/movement`);
    return this.http.get<MovementByuserID[]>(`${this.baseUrl}/user/${id}/movement`);
  }
}
