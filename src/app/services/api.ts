import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../features/environment';
import {MovementByuserID, User } from '../models/user.model';
import { AssetType } from '../shared/services/asset-type.service';
import { BusinessUnit } from '../shared/services/business-unit.service';
import { Reply, Ticket, TicketByUser } from '../models/ticket.model';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  //private baseUrl = environment.apiUrl;
  private baseUrl = environment.api.baseUrl;

  constructor(private http: HttpClient) {}

  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.baseUrl}/user`);
  }
  getUsersById(oid: string): Observable<User> {
    return this.http.get<User>(`${this.baseUrl}/user/${oid}`);
  }
  getMovementByUserId(oid: string): Observable<MovementByuserID[]>{
    return this.http.get<MovementByuserID[]>(`${this.baseUrl}/user/${oid}/movement`);
  }
  getAssetTypes(): Observable<AssetType[]>{
    return this.http.get<AssetType[]>(`${this.baseUrl}/assetType`);
  }
  getAssetTypeByCode(code: string): Observable<AssetType>{
    return this.http.get<AssetType>(`${this.baseUrl}/assetType/${code}`);
  }
  checkNotification(ticketCode: string, userCode: string): Observable<any>{
    return this.http.put(`${this.baseUrl}/ticket/checkReply/${ticketCode}/${userCode}`, null);
  }
  getBusinessUnits(): Observable<BusinessUnit[]>{
    return this.http.get<BusinessUnit[]>(`${this.baseUrl}/businessUnit`);
  }
  getReceiptByAssetAndMovement(assetCode: string, movemenetCode: string): Observable<any>{
    return this.http.get(`${this.baseUrl}/asset/${assetCode}/movement/${movemenetCode}/receipt`, { responseType: 'blob' });
  }
  getTickets(): Observable<Ticket[]>{
    return this.http.get<Ticket[]>(`${this.baseUrl}/ticket`);
  }
  getTicketByCode(ticketCode: string): Observable<Ticket>{
    return this.http.get<Ticket>(`${this.baseUrl}/ticket/${ticketCode}`);
  }
  getTicketChat(ticketCode: string): Observable<any>{
    return this.http.get(`${this.baseUrl}/ticket/${ticketCode}/replies`);
  }
  getTicketsByUser(oid: string): Observable<TicketByUser[]>{
    return this.http.get<TicketByUser[]>(`${this.baseUrl}/user/${oid}/ticket`);
  }
  putAssetTypeById(code: string, assetType: Object): Observable<any>{
    return this.http.put(`${this.baseUrl}/assetType/${code}`, assetType, { responseType: 'text' });
  }
  // putAssetTypeById(code: string, assetType: Object): Observable<AssetType> {
  //   return this.http.put(`${this.baseUrl}/assetType/${code}`, assetType, { responseType: 'text' }).pipe(map(response => JSON.parse(response).putResponse));
  // }
  putAssetActiveChangeById(code: string, assetType: Object): Observable<any>{
    return this.http.put(`${this.baseUrl}/assetType/activateDeactivate/${code}`, assetType, { responseType: 'text' })
  }
  putBusinessUnitById(code:string, businessUnit: Object): Observable<any>{
    return this.http.put(`${this.baseUrl}/businessUnit/${code}`, businessUnit, { responseType: 'text' });
  }
  putBusinessActiveChangeById(code: string, businessUnit: Object): Observable<any>{
    return this.http.put(`${this.baseUrl}/businessUnit/activateDeactivate/${code}`, businessUnit, { responseType: 'text' })
  }
  putTicketInProgress(ticketCode: string): Observable<any> {
    console.log(ticketCode);
    return this.http.put(`${this.baseUrl}/ticket/inPogress/${ticketCode}`, null);
  }
  putTicketChangeStatus(ticketCode: string, status: string, ticket: Object): Observable<Ticket>{
    return this.http.put<Ticket>(`${this.baseUrl}/ticket/changeStatus/${ticketCode}/${status}`, ticket);
  }
  putTicketChangePriority(ticketCode: string, priority: Ticket['priority']): Observable<Ticket> {
    return this.http.put<Ticket>(`${this.baseUrl}/ticket/changePriority/${ticketCode}/${priority}`, null);
  }
  postAssetType(assetType: Object): Observable<AssetType> {
    return this.http.post(`${this.baseUrl}/assetType`, assetType, { responseType: 'text' }).pipe(
      map(response => JSON.parse(response))
    );
  }
  postBusinessUnit(businessUnit: Object): Observable<any>{
    return this.http.post(`${this.baseUrl}/businessUnit`, businessUnit, { responseType: 'text' });
  }
  postTicket(request: Object): Observable<Ticket> {
    return this.http.post(`${this.baseUrl}/ticket`, request, { responseType: 'text' }).pipe(
      map(response => JSON.parse(response))
    );
  }
  postReply(reply: Object, ticketCode: string): Observable<Reply> {
    return this.http.post<Reply>(`${this.baseUrl}/ticket/${ticketCode}/reply`, reply);
  }
}