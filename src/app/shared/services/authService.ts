import { Injectable, inject } from '@angular/core';
import { MsalService } from '@azure/msal-angular';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { loginRequest } from '../../core/layout/auth-layout/auth-config/auth.config';
import { User } from '../../models/user.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private msal = inject(MsalService);
  private http = inject(HttpClient);

  login() {
    this.msal.loginRedirect(loginRequest);
  }

  logout() {
    this.msal.logoutRedirect();
    localStorage.removeItem('user');
  }

  getAccount() {
    return this.msal.instance.getActiveAccount()
        ?? this.msal.instance.getAllAccounts()[0]
        ?? null;
  }

  isLoggedIn(): boolean {
    return !!this.getAccount();
  }

  // Chiama il tuo BE per ottenere i dati utente dal DB
  getMe(): Observable<User> {
    return this.http.get<User>('http://localhost:8080/user/me');
  }

  getPostLoginRoute(user: Pick<User, 'oid' | 'userType'>): string {
    const userType = (user.userType ?? '').trim().toUpperCase();

    if (userType === 'USER' && user.oid) {
      return `/user-standard/${user.oid}`;
    }

    return '/assets';
  }
}