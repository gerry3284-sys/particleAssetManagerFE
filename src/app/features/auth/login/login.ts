import { Component, inject, OnInit, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { MsalService } from '@azure/msal-angular';
import { loginRequest } from '../../../core/layout/auth-layout/auth-config/auth.config';
import { AuthService } from '../../../shared/services/authService';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [],
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
})
export class LoginComponent implements OnInit {
  private readonly platformId = inject(PLATFORM_ID);

  constructor(
    private msalService: MsalService,
    private router: Router,
    private authService: AuthService,
  ) {}

  ngOnInit() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.redirectIfAlreadyAuthenticated();
  }

  onLogin() {
    this.msalService.loginRedirect(loginRequest);
  }

  private redirectIfAlreadyAuthenticated(): void {
  const account = this.msalService.instance.getActiveAccount()
    ?? this.msalService.instance.getAllAccounts()[0];

  if (!account) {
    return;
  }

  this.msalService.instance.setActiveAccount(account);

  this.authService.getMe().subscribe({
    next: (user) => {
      const nextRoute = this.authService.getPostLoginRoute(user);
      this.router.navigateByUrl(nextRoute);
    },
    error: (err) => {
      console.error('Errore /user/me:', err);
    }
  });
}

}