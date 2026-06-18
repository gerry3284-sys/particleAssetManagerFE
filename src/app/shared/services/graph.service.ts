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
    Promise.all([
      this.msal.instance.acquireTokenSilent({
        scopes: ['https://graph.microsoft.com/.default'],
        account
      }),
      this.msal.instance.acquireTokenSilent({
        scopes: ['6618f68e-5225-4b93-ae0c-42eb4425432e/.default'],
        account
      })
    ])
  ).pipe(
    switchMap(([graphResult, appResult]) => {
      this.graphToken = graphResult.accessToken;

      const headers = new HttpHeaders({
        'Authorization': `Bearer ${appResult.accessToken}`,
        'X-Graph-Token': graphResult.accessToken
      });

      return this.http.post('http://localhost:8080/graph/groups', {}, { headers });
    }),
    catchError((error) => {
      console.error('errorCode:', error?.errorCode);
      console.error('errorMessage:', error?.errorMessage);
      return throwError(() => error);
    })
  );
}

private graphToken: string | null = null;
getGraphToken() { return this.graphToken; }
}