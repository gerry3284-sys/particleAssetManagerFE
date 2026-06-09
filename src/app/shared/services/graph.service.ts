import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { MsalService } from '@azure/msal-angular';
import { InteractionRequiredAuthError } from '@azure/msal-browser';
import { graphRequest, msalConfig } from '../../core/layout/auth-layout/auth-config/auth.config';
import { EMPTY, from, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class GraphService {

  constructor(
    private http: HttpClient,
    private msal: MsalService
  ) {}

  getUserGroups() {
  const account = this.msal.instance.getActiveAccount()
    ?? this.msal.instance.getAllAccounts()[0];

  return from(
    this.msal.instance.acquireTokenSilent({
      scopes: ['https://graph.microsoft.com/.default'],
      account
    })
  ).pipe(
    switchMap(result => {
      const headers = new HttpHeaders({
        'X-Graph-Token': result.accessToken
      });

      //console.log('TOKEN:', result.accessToken);
      return this.http.post('http://localhost:8080/graph/groups', {}, { headers });
    }),
    catchError((error) => {
      console.error('errorCode:', error?.errorCode);
      console.error('errorMessage:', error?.errorMessage);
      return throwError(() => error);
    })
  );
}
}