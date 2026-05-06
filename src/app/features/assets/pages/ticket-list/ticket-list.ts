import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from "@angular/forms";
import { Ticket } from '../../../../models/ticket.model';
import { DatePipe } from '@angular/common';
import { ApiService } from '../../../../services/api';
import { PopupMessageService } from '../../../../shared/services/popup-message.service';
import { AssetService } from '../../../../shared/services/asset.service';
import { User } from '../../../../models/user.model';
import { Asset } from '../../../../shared/models/asset.interface';
import { forkJoin } from 'rxjs/internal/observable/forkJoin';
import { PaginationComponent } from "../../../../shared/components/pagination/pagination";
import { Subject } from 'rxjs/internal/Subject';
import { BusinessUnit } from '../../../../shared/services/business-unit.service';
import { Router } from '@angular/router';
import { AssetType } from '../../../../shared/services/asset-type.service';


@Component({
  selector: 'app-ticket-list',
  imports: [PaginationComponent, DatePipe, FormsModule],
  templateUrl: './ticket-list.html',
  styleUrl: './ticket-list.css',
})
export class TicketList implements OnInit {
  tickets = signal<Ticket[]>([]);
  users = signal<User[]>([]);
  businessUnits = signal<BusinessUnit[]>([]);
  assets = signal<Asset[]>([]);
  assetTypes = signal<AssetType[]>([]);

  // calledUsers = signal<string[]>([]);

  loading = signal(true);
  isVisible = signal(true);
  reload$ = new Subject<boolean>();
  private destroyRef = inject(DestroyRef);

  statusFilter = '';
  titleFilter = '';
  userFilter = '';

  constructor(private apiService: ApiService,
    private readonly popupMessageService: PopupMessageService,
    private assetService: AssetService,
    private router: Router
  ){
    const subscription = forkJoin({
      tickets: this.apiService.getTickets(),
      users: this.apiService.getUsers(),
      businessUnits: this.apiService.getBusinessUnits(),
      assets: this.assetService.getAssets(),
      assetTypes: this.apiService.getAssetTypes()
    }).subscribe({
      next: ({ tickets, users, assets, businessUnits, assetTypes }) => {
        this.tickets.set(tickets ?? []);
        this.users.set(users ?? []);
        this.assets.set(assets ?? []);
        this.businessUnits.set(businessUnits ?? []);
        this.assetTypes.set(assetTypes ?? []);

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

  calledUsers = computed(() => {
    return this.tickets().map(ticket => {
      const user = this.users().find(u => u.oid === ticket.userCode);
      const businessUnit = this.businessUnits().find(b => {
        if (user?.businessUnit === null) {
          return b.name === 'Admin';
        } else {
          return b.name === user?.businessUnit?.name;
        }
      });
      return user ? `${user.name} ${user.surname} di ${businessUnit?.name ?? '-'}`: '-';
    });
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
        return title = title + `Dismissione: ${asset?.serialNumber}`;
      } else{
        return title = title + `Riparazione: ${asset?.serialNumber}`;
      }
    })
  });

  ngOnInit(): void {
    this.reloadDiv();
  }
  // ngOnInit(): void {
  //   for(let ticket in this.tickets()){
  //     const ticketUser = this.tickets()[ticket];

  //     const user = this.users().find(u => u.oid === ticketUser.userCode);
  //     const businessUnit = this.businessUnits().find(b => {

  //       if(user?.businessUnit === null){
  //         return b.name = 'Admin';
  //       }
  //       else{
  //         return b.name === user?.businessUnit.name;
  //       }
  //     });
  //     this.calledUsers.set([...this.calledUsers(), user ? user.name + ' ' + user.surname + ' di ' + businessUnit?.name : '-']);
  //   }
  //   this.reloadDiv();
  // }

  onFilter(){

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
  control(){
    console.log('calledUsers: ', this.calledUsers());
    console.log(this.users());
    console.log(this.tickets());
  }

  onNavigate(code: string){
    this.router.navigate(['/tickets/ticket-detail', code]);
  }
  reloadDiv() {
    this.isVisible.set(false);
    setTimeout(() => {
      this.isVisible.set(true);
      this.reload$.next(true);
    }, 0);
  }
}
