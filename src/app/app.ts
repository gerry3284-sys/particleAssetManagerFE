import { Component, inject, OnInit, PLATFORM_ID } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { PopupMessageComponent } from './shared/components/popup-message/popup-message';
import { MsalService, MsalBroadcastService } from '@azure/msal-angular';
import { InteractionStatus } from '@azure/msal-browser';
import { isPlatformBrowser } from '@angular/common';
import { filter, take } from 'rxjs';
import { AuthService } from './shared/services/authService';
import { GraphService } from './shared/services/graph.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, PopupMessageComponent],
  templateUrl: './app.html',
})
export class App implements OnInit {
  private readonly platformId = inject(PLATFORM_ID);

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
    
    // Inizializza MSAL
    await this.msalService.instance.initialize();
    await this.msalService.instance.handleRedirectPromise();

    // Aspetta che MSAL abbia finito il redirect
    this.msalBroadcast.inProgress$
      .pipe(
        filter(status => status === InteractionStatus.None),
        take(1)
      )
      .subscribe(async () => {
        const account = this.msalService.instance.getAllAccounts()[0];

        if (account) {
          // Imposta l'account attivo
          this.msalService.instance.setActiveAccount(account);
            const result = await this.msalService.instance.acquireTokenSilent({
              scopes: ['https://graph.microsoft.com/.default'],
              account
            });
            ///console.log('TOKEN:', result.accessToken);
          // Debug account
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
            },
            error: (err) => {
              console.error('Errore chiamata Graph:', err);
            }
          });

          // Chiamata al backend
          this.authService.getMe().subscribe({
            next: (user) => {
              console.log('Utente backend /user/me:', user);
              const nextRoute = this.authService.getPostLoginRoute(user);
              this.router.navigateByUrl(nextRoute);
            },
            error: (err) => {
              console.error('Errore /user/me:', err);
              this.router.navigate(['/404']);
            }
          });
        }
      });
  }
}
