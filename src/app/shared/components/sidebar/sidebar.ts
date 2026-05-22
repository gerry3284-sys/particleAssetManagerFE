import { Component, OnInit, computed, inject, signal, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { ButtonComponent } from '../button/button';
import { AssetService } from '../../services/asset.service';
import { AssetStateService } from '../../services/asset-state.service';
import { UnderMaintenanceAsset } from '../../models/asset.interface';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ApiService } from '../../../services/api';
import { Ticket } from '../../../models/ticket.model';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, ButtonComponent],
  styleUrl: './sidebar.css',
  templateUrl: './sidebar.html',
})
export class SidebarComponent implements OnInit {
  private static readonly THEME_STORAGE_KEY = 'pam-theme';
  private readonly router = inject(Router);
  private readonly assetService = inject(AssetService);
  private readonly assetStateService = inject(AssetStateService);
  private readonly ticketService = inject(ApiService);
  private readonly destroyRef = inject(DestroyRef);

  isDarkTheme = signal(false);
  maintenanceAssets = signal<UnderMaintenanceAsset[]>([]);
  nonViewedTickets = signal<number>(0);

  newMaintenanceAssetsCount = computed(() => {
    return this.maintenanceAssets().filter(
      (asset: UnderMaintenanceAsset) => !asset.inProgress
    ).length;
  });

  /*nonRepliedTicketsCount = computed(() => {
    return this.nonviewedTickets().length;
  });*/

  constructor() {
    this.syncThemeStateFromDom();
  }

  ngOnInit(): void 
  {
    this.loadMaintenanceAssets();
    this.loadNonViewedTickets();


    // Ascolta i cambiamenti di stato degli asset
    this.assetStateService.assetStateChanged
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(event => {
        //if (event.type === 'maintenance' || event.type === 'available' || event.type === 'working') {
          // Ricarica gli asset in manutenzione quando uno viene messo in manutenzione
          this.loadMaintenanceAssets();
        //}
      });

    this.assetStateService.ticketsChanged
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.loadNonViewedTickets();
      });
  }

  private loadMaintenanceAssets(): void {
    this.assetService.getUnderMaintenanceAssets().subscribe({
      next: (assets: UnderMaintenanceAsset[]) => this.maintenanceAssets.set(assets),
      error: (err: any) => console.error('Errore caricamento asset manutenzione:', err)
    });
  }

  private loadNonViewedTickets(): void 
  {
    this.ticketService.getTickets().subscribe({
      next:(tickets: Ticket[]) => this.nonViewedTickets.set
        (tickets.filter(ticket => ticket.adminCheckReply === false).length),
      error: (err: any) => console.error('Errore caricamento ticket:', err)
    })
  }

  onLogout(): void {
    this.router.navigate(['/login']);
  }

  onToggleTheme(): void {
    if (typeof document === 'undefined') {
      return;
    }

    const nextIsDark = !this.isDarkTheme();
    document.body.classList.toggle('theme-dark', nextIsDark);
    this.isDarkTheme.set(nextIsDark);

    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(SidebarComponent.THEME_STORAGE_KEY, nextIsDark ? 'dark' : 'light');
    }
  }

  themeToggleLabel(): string {
    return this.isDarkTheme() ? 'Tema chiaro' : 'Tema scuro';
  }

  private syncThemeStateFromDom(): void {
    if (typeof document === 'undefined') {
      return;
    }

    this.isDarkTheme.set(document.body.classList.contains('theme-dark'));
  }

}
