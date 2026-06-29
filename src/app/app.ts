import { Component, inject, OnInit, PLATFORM_ID, signal } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { PopupMessageComponent } from './shared/components/popup-message/popup-message';
import { MsalService, MsalBroadcastService } from '@azure/msal-angular';
import { InteractionStatus } from '@azure/msal-browser';
import { isPlatformBrowser } from '@angular/common';
import { filter, take } from 'rxjs';
import { AuthService } from './shared/services/authService';
import { GraphService } from './shared/services/graph.service';
import { LoadingSpinnerComponent } from './shared/services/loading-spinner';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, PopupMessageComponent, LoadingSpinnerComponent],
  templateUrl: './app.html',
})
export class App implements OnInit {
  private readonly platformId = inject(PLATFORM_ID);

  isInitializing = signal(true);

  constructor(
    private msalService: MsalService,
    private msalBroadcast: MsalBroadcastService,
    private authService: AuthService,
    private router: Router,
    private graphService: GraphService
  ) {}

  async ngOnInit() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    // Se siamo sulla pagina di login, non mostrare lo spinner globale
    // (la pagina di login ha già il suo stato visivo)
    if (this.router.url === '/login' || this.router.url === '/') {
      this.isInitializing.set(false);
    }

    await this.msalService.instance.initialize();
    await this.msalService.instance.handleRedirectPromise();

    this.msalBroadcast.inProgress$
      .pipe(
        filter(status => status === InteractionStatus.None),
        take(1)
      )
      .subscribe(async () => {
        const account = this.msalService.instance.getAllAccounts()[0];

        if (account) {
          this.isInitializing.set(true);

          this.msalService.instance.setActiveAccount(account);
          await this.msalService.instance.acquireTokenSilent({
            scopes: ['https://graph.microsoft.com/.default'],
            account
          });

          console.log('Account MSAL attivo:', {
            name: account.name,
            username: account.username,
            homeAccountId: account.homeAccountId,
            tenantId: account.tenantId,
            oid: account.idTokenClaims?.oid,
            idTokenClaims: account.idTokenClaims
          });

          this.graphService.getUserGroups().subscribe({
            next: (groups) => {
              console.log('Gruppi utente da Graph:', groups);

              this.authService.getMe().subscribe({
                next: (user) => {
                  console.log('Utente backend /user/me:', user);
                  const nextRoute = this.authService.getPostLoginRoute(user);
                  localStorage.setItem('user', JSON.stringify(user));
                  this.router.navigateByUrl(nextRoute).then(() => {
                    this.isInitializing.set(false);
                  });
                },
                error: (err) => {
                  console.error('Errore /user/me:', err);
                  this.isInitializing.set(false);
                  this.router.navigate(['/404']);
                }
              });
            },
            error: (err) => {
              console.error('Errore chiamata Graph:', err);
              this.isInitializing.set(false);
              this.router.navigate(['/404']);
            }
          });
        } else {
          // Nessun account: vai al login, niente da aspettare
          this.isInitializing.set(false);
        }
      });
  }
}