import { Component, computed, DestroyRef, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from "@angular/forms";
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
import { AssetType } from '../../../shared/services/asset-type.service';
import { AssetStateService } from '../../../shared/services/asset-state.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

type EnrichedTicket = TicketByUser & { displayTitle: string};

@Component({
  selector: 'app-user-standard-tickets',
  imports: [DatePipe, PaginationComponent, FormsModule],
  templateUrl: './user-standard-tickets.html',
  styleUrl: './user-standard-tickets.css',
})
export class UserStandardTickets implements OnInit {
  users = signal<User[]>([]);
  businessUnits = signal<BusinessUnit[]>([]);
  assets = signal<Asset[]>([]);
  assetTypes = signal<AssetType[]>([]);
  tickets = signal<TicketByUser[]>([]);

  statusFilter = '';
  titleFilter = '';
  // userFilter = '';

  filterTimeout: any;
  filteredTickets = signal<TicketByUser[]>([]);

  loading = signal(true);
  private destroyRef = inject(DestroyRef);
  isVisible = signal(true);
  reload$ = new Subject<boolean>();

  constructor(private apiService: ApiService,
    private readonly popupMessageService: PopupMessageService,
    private assetService: AssetService,
    private router: Router,
    public route: ActivatedRoute,
    private ticketStateService: AssetStateService
  ){
  this.loadTickets();
}

private loadTickets(): void {
  const oid = this.route.snapshot.paramMap.get('oid');
  this.loading.set(true);

  const subscription = forkJoin({
    tickets: this.apiService.getTicketsByUser(oid ?? ''),
    users: this.apiService.getUsers(),
    businessUnits: this.apiService.getBusinessUnits(),
    assets: this.assetService.getAssets(),
    assetTypes: this.apiService.getAssetTypes()
  }).subscribe({
    next: ({ tickets, users, assets, businessUnits, assetTypes }) => {
      this.tickets.set(tickets ?? []);
      this.filteredTickets.set(tickets ?? []);
      this.users.set(users ?? []);
      this.assets.set(assets ?? []);
      this.businessUnits.set(businessUnits ?? []);
      this.assetTypes.set(assetTypes ?? []);
      this.onFilter();
      this.loading.set(false);
    },
    error: (error) => {
      console.error('Errore durante il recupero dei dati:', error);
      this.popupMessageService.error('Errore durante il caricamento dei dati');
      this.tickets.set([]);
      this.users.set([]);
      this.assets.set([]);
      this.businessUnits.set([]);
      this.assetTypes.set([]);
      this.loading.set(false);
    }
  });
  this.destroyRef.onDestroy(() => subscription.unsubscribe());
}

ngOnInit(): void {
  this.ticketStateService.ticketsChanged
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe(() => {
      this.loadTickets();
    });
}

  enrichedTickets = computed(() =>
    this.tickets().map(ticket => {
      const displayUser = ticket.user ?? '-';

      let displayTitle = 'Richiesta ';
      const asset = this.assets().find(a => a.assetCode === ticket.assetCode);
      if (ticket.operation === 'ASSIGNED') {
        const assetType = this.assetTypes().find(a => a.code === ticket.assetTypeCode);
        displayTitle += `Assegnazione: ${assetType?.name}`;
      } else if (ticket.operation === 'DISMISSED') {
        displayTitle += `Dismissione: ${asset?.brand} ${asset?.model}`;
      } else {
        displayTitle += `Restituzione: ${asset?.brand} ${asset?.model}`;
      }

      return { ...ticket, displayTitle};
    })
  );

  //flippa i ticket per avere il più recente prima e il più lontano dopo
  sortedTickets = computed((): EnrichedTicket[] => {
    return [...this.filteredTickets()]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .map(ticket => {
        const displayUser = ticket.user ?? '-';

        let displayTitle = 'Richiesta ';
        const asset = this.assets().find(a => a.assetCode === ticket.assetCode);
        if (ticket.operation === 'ASSIGNED') {
          const assetType = this.assetTypes().find(a => a.code === ticket.assetTypeCode);
          displayTitle += `Assegnazione: ${assetType?.name}`;
        } else if (ticket.operation === 'DISMISSED') {
          displayTitle += `Dismissione: ${asset?.brand} ${asset?.model}`;
        } else {
          displayTitle += `Restituzione: ${asset?.brand} ${asset?.model}`;
        }
    
        return { ...ticket, displayTitle};
      });
  });

paginatedTickets = computed((): EnrichedTicket[] => {
  const start = (this.currentPage() - 1) * this.itemsPerPage();
  return this.sortedTickets().slice(start, start + this.itemsPerPage());
});

  titleTicket = computed(() =>{
    return this.tickets().map(ticket =>{
      let title = 'Richiesta ';
      let asset = this.assets().find(a => a.assetCode === ticket.assetCode);

      const operation = ticket.operation;
      if(operation === 'ASSIGNED'){
        const assetType = this.assetTypes().find(a => a.code === ticket.assetTypeCode);
        return title = title + `Assegnazione: ${assetType?.name}`;
      } else if(operation === 'DISMISSED'){
        return title = title + `Dismissione: ${asset?.brand} ${asset?.model}`;
      } else{
        return title = title + `Restituzione: ${asset?.brand} ${asset?.model}`;
      }
    })
  });

  currentPage = signal(1);
  itemsPerPage = signal(8);

  // ricalcolo e aggiorno automaticamente dopo ogni cambiamento
  totalPages = computed(() => {
    return Math.ceil(this.sortedTickets().length / this.itemsPerPage());
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

  onFilter() {
      if (this.filterTimeout) {
        clearTimeout(this.filterTimeout);
      }
  
      this.filterTimeout = setTimeout(() => {
        let filtered = this.enrichedTickets();
  
        if (this.statusFilter !== '') {
          filtered = filtered.filter(e => e.status === this.statusFilter);
        }
  
        if (this.titleFilter !== '') {
          const searchTitle = this.titleFilter.toLowerCase();
          filtered = filtered.filter(e => e.displayTitle.toLowerCase().includes(searchTitle));
        }
  
        // if (this.userFilter !== '') {
        //   const searchUser = this.userFilter.toLowerCase();
        //   filtered = filtered.filter(e => e.displayUser.toLowerCase().includes(searchUser));
        // }
  
        this.filteredTickets.set(filtered.map(({ displayTitle, ...ticket }) => ticket as TicketByUser));
        this.currentPage.set(1);
      }, 500);
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
