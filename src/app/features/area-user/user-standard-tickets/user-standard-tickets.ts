import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { TicketByUser } from '../../../models/ticket.model';
import { ApiService } from '../../../services/api';
import { PopupMessageService } from '../../../shared/services/popup-message.service';
import { AssetService } from '../../../shared/services/asset.service';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs/internal/observable/forkJoin';
import { Asset } from '../../../shared/models/asset.interface';
import { BusinessUnit } from '../../../shared/services/business-unit.service';
import { User } from '../../../models/user.model';
import { Subject } from 'rxjs/internal/Subject';
import { DatePipe } from '@angular/common';
import { PaginationComponent } from "../../../shared/components/pagination/pagination";

@Component({
  selector: 'app-user-standard-tickets',
  imports: [DatePipe, PaginationComponent],
  templateUrl: './user-standard-tickets.html',
  styleUrl: './user-standard-tickets.css',
})
export class UserStandardTickets {
  users = signal<User[]>([]);
  businessUnits = signal<BusinessUnit[]>([]);
  assets = signal<Asset[]>([]);
  tickets = signal<TicketByUser[]>([]);

  loading = signal(true);
  private destroyRef = inject(DestroyRef);
  isVisible = signal(true);
  reload$ = new Subject<boolean>();

  constructor(private apiService: ApiService,
    private readonly popupMessageService: PopupMessageService,
    private assetService: AssetService,
    private router: Router,
    public route: ActivatedRoute,
  ){
    const oid = this.route.snapshot.paramMap.get('oid');

    const subscription = forkJoin({
      tickets: this.apiService.getTicketsByUser(oid ?? ''),
      users: this.apiService.getUsers(),
      businessUnits: this.apiService.getBusinessUnits(),
      assets: this.assetService.getAssets()
    }).subscribe({
      next: ({ tickets, users, assets, businessUnits }) => {
        this.tickets.set(tickets ?? []);
        this.users.set(users ?? []);
        this.assets.set(assets ?? []);
        this.businessUnits.set(businessUnits ?? []);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Errore durante il recupero dei dati:', error);
        this.popupMessageService.error('Errore durante il caricamento dei dati');

        this.tickets.set([]);
        this.users.set([]);
        this.assets.set([]);
        this.businessUnits.set([]);
        this.loading.set(false);
      }
    });
    this.destroyRef.onDestroy(() => subscription.unsubscribe());
  }

  //flippa i ticket per avere il più recente prima e il più lontano dopo
  sortedTickets = computed(() =>
    [...this.tickets()].sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )
  );

  currentPage = signal(1);
  itemsPerPage = signal(8);

  // ricalcolo e aggiorno automaticamente dopo ogni cambiamento
  totalPages = computed(() => {
    return Math.ceil(this.sortedTickets().length / this.itemsPerPage());
  });

  // si aggiorna automaticamente quando cambi pagina o aggiungi/rimuovi users
  paginatedTickets = computed(() => {
    const start = (this.currentPage() - 1) * this.itemsPerPage();
    const end = start + this.itemsPerPage();
    return this.sortedTickets().slice(start, end);
  });

  //creazione stringa display range.
  displayRange = computed(() => {
    const start = (this.currentPage() - 1) * this.itemsPerPage() + 1;
    const end = Math.min(this.currentPage() * this.itemsPerPage(), this.sortedTickets().length);
    return `Mostrando ${start}-${end} di ${this.sortedTickets().length}`;
  });
  goToPage(page: number): void {
    this.currentPage.set(page);
  }

  onNavigate(ticketCode: string) {
    this.router.navigate(['user-standard/:oid/ticket/ticket-detail/:ticketCode']
      .map(path => path.replace(':oid', this.route.snapshot.paramMap.get('oid') ?? '').replace(':ticketCode', ticketCode)));
  }

  goBack(): void {
    this.router.navigate(['/user-standard', this.route.snapshot.paramMap.get('oid')]);
  }

  reloadDiv() {
    this.isVisible.set(false);
    setTimeout(() => {
      this.isVisible.set(true);
      this.reload$.next(true);
    }, 0);
  }
}
