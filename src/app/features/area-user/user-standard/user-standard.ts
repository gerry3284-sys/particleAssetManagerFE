 import { Component, computed, DestroyRef, ElementRef, inject, signal, ViewChild } from '@angular/core';
 import { FormsModule } from "@angular/forms";
 import { ActivatedRoute, Router } from "@angular/router";
import { ApiService } from '../../../services/api';
import { User, MovementByuserID } from '../../../models/user.model';
import { DatePipe, NgClass } from '@angular/common';
import { forkJoin } from 'rxjs';
import { PaginationComponent } from "../../../shared/components/pagination/pagination";
import { ButtonComponent } from "../../../shared/components/button/button";
import { PopupMessageService } from '../../../shared/services/popup-message.service';
import { AssetType } from '../../../shared/services/asset-type.service';
// import { AssetStatusType } from '../../../shared/models/filter-config.interface';
import { Asset } from '../../../shared/models/asset.interface';
import { AssetService } from '../../../shared/services/asset.service';
import { AssetStateService } from '../../../shared/services/asset-state.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TicketByUser } from '../../../models/ticket.model';
import { AuthService } from '../../../shared/services/authService';
import { effect } from '@angular/core';

@Component({
  selector: 'app-user-standard',
  imports: [DatePipe, PaginationComponent, ButtonComponent, FormsModule],
  templateUrl: './user-standard.html',
  styleUrl: './user-standard.css',
})
export class UserStandard{
  private static readonly THEME_STORAGE_KEY = 'pam-theme';
  private destroyRef = inject(DestroyRef);
  user = signal<User | null>(null);
  // users = signal<User[]>([]);
  // assetStatusTypes = signal<AssetStatusType[]>([]);
  assetTypes = signal<AssetType[]>([]);
  movements = signal<MovementByuserID[]>([]);
  assets = signal<Asset[]>([]);
  unmergedMovement: MovementByuserID[] = ([]);
  downloadableMovement: MovementByuserID|null = null;

  isDarkTheme = signal(false);
  controlRequestType = signal<string>('');
  controlRequest = signal<string>('');
  requestNotes = signal<string>('');
  requestType = signal<string>('');
  requestAsset = signal<string>('');
  //requestPriority = signal<string>('');
  nonViewedTickets = signal<number>(0);
  requestPriority = signal<string>('');

  @ViewChild('myDialog') dialog!: ElementRef<HTMLDialogElement>;
  @ViewChild('askDialog') askDialog!: ElementRef<HTMLDialogElement>;

  //computed per inserire le informazioni dell'utente nella carta
  fullName = computed(() => {
    const user = this.user();
    if (!user) return '-';
    return `${user.name} ${user.surname}`;
  });
  justName = computed(() => {
    const user = this.user();
    if(!user) return '-';
    return `${user.name}`;
  });
  businessUnit = computed(() => {
    const user = this.user();
    if (!user) return '-';
    if (!user.businessUnit) return '-';
    return `${user.businessUnit.name}`;
  });
  email = computed(() => {
    const user = this.user();
    if (!user) return '-';
    return `${user.email}`;
  });
  phoneNumber = computed(() => {
    const user = this.user();
    if (!user) return '-';
    return `${user.phoneNumber.slice(0, 3)} ${user.phoneNumber.slice(3, 6)} ${user.phoneNumber.slice(6, 10)}`;
  });
  assigneedAssets = computed(() => {
    /*const user = this.user();
    if (!user) return [];
    return this.assets().filter(asset => asset.assignedUser === user.name);*/
    const assetList = this.movements();
    if(!assetList) return [];
    return assetList.filter(movement => movement.movementType === 'ASSIGNED').map(movement => movement.asset);
  });

  //request per prendere tutte le info
  constructor(private apiService: ApiService,
    private route: ActivatedRoute,
    private ticketStateService: AssetStateService,
    private router: Router,
    private readonly popupMessageService: PopupMessageService,
    private assetService: AssetService,
    private ticketService: ApiService,
    private authService: AuthService
  ){
    const id = this.route.snapshot.paramMap.get('oid');
    /*if (!id || isNaN(+id)) {
      this.router.navigate(['/404']);
      return;
    }*/

    const subscription = forkJoin({
      user: this.apiService.getUsersById(id? id:''),
      // assetStatusType: this.filterService.getAssetStatusTypes(false),
      assetType: this.apiService.getAssetTypes(),
      movements: this.apiService.getMovementByUserId(id? id:''),
    }).subscribe({
      next: ({ user, assetType, movements }) => {
        this.user.set(user ?? {});
        // this.assetStatusTypes.set(assetStatusType ?? []);
        this.assetTypes.set(assetType ?? []);
        this.movements.set(movements ?? []);
        this.unmergedMovement = movements;

        if (this.user()?.userType !== 'USER') {
          this.router.navigate(['/404']);
          return;
        }
        this.loadNonViewedTickets();
        // const processed = this.mergeMovements(movements ?? []);
        // this.movements.set(processed);
      },
      error: err => {
        if(err.status === 404){
          this.router.navigate(['/404']);
        }
        else{
          this.popupMessageService.error('Errore nel caricamento dei dati dell\'utente.');
          console.error('API error', err);
        }
        this.user.set(null);
        // this.assetStatusTypes.set([]);
        this.assetTypes.set([]);
        this.movements.set([]);
        this.unmergedMovement = [];
      }
    });

    effect(() => 
    {
      const type = this.controlRequestType();

      if (type !== '') {
        this.controlRequest.set('');
        this.requestNotes.set('');
        this.requestType.set('');
        this.requestPriority.set('');
        this.requestAsset.set('');
      }
    });
    this.destroyRef.onDestroy(() => subscription.unsubscribe());
  }

  //request per ottenere asset
  ngOnInit(): void {

    const subscription = this.assetService.getAssets().subscribe({
      next: (data) => {
        this.assets.set(data ?? []);
      },
      error: (err) => {
        this.popupMessageService.error('Errore nel caricamento degli asset');
        console.error('Errore nel caricamento degli asset', err);
        this.assets.set([]);
      }
    });

    this.destroyRef.onDestroy(() => subscription.unsubscribe());

    this.ticketStateService.ticketsChanged
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.loadNonViewedTickets();
      });
  }

  private loadNonViewedTickets(): void 
    {
      this.ticketService.getTicketsByUser(this.user()!.oid).subscribe({
        next:(tickets: TicketByUser[]) => this.nonViewedTickets.set
          (tickets.filter(ticket => ticket.userCheckReply === false).length),
        error: (err: any) => console.error('Errore caricamento ticket:', err)
      })
    }

  //flippa i movement per avere il più recente prima e il più lontano dopo
  sortedMovements = computed(() =>
    [...this.movements()].sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )
  );
  sortedUnmergedMovements = computed(() =>
    [...this.unmergedMovement].sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )
  );

  currentPage = signal(1);
  itemsPerPage = signal(4);

  // ricalcolo e aggiorno automaticamente dopo ogni cambiamento
  totalPages = computed(() => {
    return Math.ceil(this.sortedMovements().length / this.itemsPerPage());
  });

  // si aggiorna automaticamente quando cambi pagina o aggiungi/rimuovi users
  paginatedMovements = computed(() => {
    const start = (this.currentPage() - 1) * this.itemsPerPage();
    const end = start + this.itemsPerPage();
    return this.sortedMovements().slice(start, end);
  });

  //creazione stringa display range.
  displayRange = computed(() => {
    const start = (this.currentPage() - 1) * this.itemsPerPage() + 1;
    const end = Math.min(this.currentPage() * this.itemsPerPage(), this.sortedMovements().length);
    return `Mostrando ${start}-${end} di ${this.sortedMovements().length}`;
  });
  goToPage(page: number): void {
    this.currentPage.set(page);
  }
  
  //unione dei movement di assigned con il suo returned per occupare una righa sola
  // mergeMovements(movements: MovementByuserID[]): MovementByuserID[]{
  // const toDelete = new Set<number>();

  // const result = movements.map(move => {
  //   if (move.movementType === 'Assigned') {
  //     const returned = movements.filter(
  //       m =>
  //         m.asset.serialNumber === move.asset.serialNumber &&
  //         m.movementType === 'Returned' &&
  //         new Date(m.date) > new Date(move.date)
  //     ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];

  //     if (returned) {
  //       toDelete.add(returned.id);
  //       return { ...move, updateDate: returned.date };
  //     }
  //   }
  //   return move;
  // });
  // return result.filter(m => !toDelete.has(m.id));
  // }

  //funzioni riguardo al download del movimento
  onOpenPDFDialog(movement: MovementByuserID){
    this.downloadableMovement = movement;

    this.dialog.nativeElement.showModal();
  }
  onClosePDFDialog(){
    this.downloadableMovement = null;
    this.dialog.nativeElement.close();
  }
  onDownloadPDF(assetCode: string|undefined, movementCode: string|undefined){
    console.log('Downloading PDF for asset code:', assetCode, 'and movement code:', movementCode);
    this.apiService.getReceiptByAssetAndMovement(assetCode!, movementCode!).subscribe(pdf => {
      const url = URL.createObjectURL(pdf);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ricevuta_${assetCode}_${movementCode}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    })
    this.dialog.nativeElement.close();
    this.downloadableMovement = null;
  }
  onOpenAskDialog(){
    this.askDialog.nativeElement.showModal();
  }
  onCloseAskDialog(){
    this.controlRequestType.set('');
    this.controlRequest.set('');
    this.requestNotes.set('');
    this.requestType.set('');
    this.requestPriority.set('');
    this.requestAsset.set('');
    
    this.askDialog.nativeElement.close();
  }
  onAskDialogBackdropClick(){
    this.onCloseAskDialog();
  }
  
  isInvalid(): boolean
  {
    if(this.controlRequestType() !=='')
    {
      if(this.controlRequestType() === 'HARDWARE')
      {
        if(this.controlRequest() === '') return true;
        else if(this.controlRequest() === 'ASSIGNED' 
                && (this.requestType() === '' || this.requestNotes() === '') || this.requestPriority() === '') return true;
        else if((this.controlRequest() === 'DISMISSED' || this.controlRequest() === 'RETURNED') 
                  && (this.requestAsset() === '' || this.requestNotes() === '') || this.requestPriority() === '') return true;

        return false;
      }
      else if(this.controlRequestType() === 'SOFTWARE')
      {
        if(this.controlRequest() === '' || this.requestNotes() === '' || this.requestPriority() === '') return true;
        return false;
      }
      else if(this.controlRequestType() === 'NETWORK' && this.requestNotes() === '' || this.requestPriority() === '') 
         return true;
      else 
        return false;
    }
    else {return true};
  }
  /*isInvalid(): boolean 
  {
    if(this.controlRequestType() !=='')
    {
      if(this.controlRequestType() === 'ASSEGNAZIONE')
      {
        if(this.requestType() === '' || this.requestNotes() === '') return true;
        return false;
      }
      else if(this.controlRequestType() === 'DISMISSIONE' || this.controlRequestType() === 'RICONSEGNA'){
        if(this.requestAsset() === '' || this.requestNotes() === '') return true;
        return false;
      }
      else return true;
    }
    else {return true};
  }*/
  // controlReturnedId(){
  //   const returned = computed(() => this.sortedUnmergedMovements().find(movement =>
  //     movement.asset.serialNumber === this.downloadableMovement!.asset.serialNumber &&
  //     movement.movementType === 'Returned' &&
  //     movement.date === this.downloadableMovement!.updateDate
  //   ));
  //   this.onDownloadPDF(returned()?.asset.code, returned()?.id);
  // }
  // controlReturnedDate(): boolean{
  //   return !(this.downloadableMovement?.updateDate !== undefined);
  // }
  //Richiama il login e fa uscire da pagina di user
  onsendRequest()
  {
    if(this.controlRequestType() === 'HARDWARE')
    {
      if(this.controlRequest() === 'ASSIGNED')
      {
        const requestTypeId = this.assetTypes().find(type => type.name === this.requestType())?.code;
        const postableAssignedRequest = {
          userCode: this.user()!.oid,
          operation: 'HARDWARE - Assegnazione: ' + (this.requestType() === 'EXTERNAL' ? 'Esterna' : 'Interna') + ' all\'azienda',
          assetTypeCode: requestTypeId,
          assetCode: null,
          message: this.requestNotes(),
          clientProject: this.requestPriority() === 'EXTERNAL' ? true : false
        }
        this.apiService.postTicket(postableAssignedRequest).subscribe({
          next: () => {
            this.popupMessageService.success('Richiesta di assegnazione inviata con successo.');
            this.ticketStateService.notifyTicketsChanged();
          },
          error: (err) => {
            this.popupMessageService.error('Errore nell\'inzio della richiesta: ', err.message);
          }
        });
      }
      else if(this.controlRequest() === 'DISMISSED')
      {
        const postableDismissedRequest = {
          userCode: this.user()!.oid,
          operation: 'HARDWARE - Dismissione: ' + (this.requestType() === 'EXTERNAL' ? 'Esterna' : 'Interna') + ' all\'azienda',
          assetTypeCode: null,
          assetCode: this.requestAsset(),
          message: this.requestNotes(),
          clientProject: this.requestPriority() === 'EXTERNAL' ? true : false
        }
        this.apiService.postTicket(postableDismissedRequest).subscribe({
          next: () => {
            this.popupMessageService.success('Richiesta di dismissione inviata con successo.');
            this.ticketStateService.notifyTicketsChanged();
          },
          error: (err) => {
            this.popupMessageService.error('Errore nell\'inzio della richiesta: ', err.message);
          }
        });
      }
      else if(this.controlRequest() === 'RETURNED')
      {
        const postableReturnedRequest = {
          userCode: this.user()!.oid,
          operation: 'HARDWARE - Restituzione: ' + (this.requestType() === 'EXTERNAL' ? 'Esterna' : 'Interna') + ' all\'azienda',
          assetTypeCode: null,
          assetCode: this.requestAsset(),
          message: this.requestNotes(),
          clientProject: this.requestPriority() === 'EXTERNAL' ? true : false
        }
        this.apiService.postTicket(postableReturnedRequest).subscribe({
          next: () => {
            this.popupMessageService.success('Richiesta di riconsegna inviata con successo.');
            this.ticketStateService.notifyTicketsChanged();
          },
          error: (err) => {
            this.popupMessageService.error('Errore nell\'inzio della richiesta: ', err.message);
          }
        });
      }
      else if(this.controlRequest() === 'BROKEN')
      {
        const postableBrokenRequest = {
          userCode: this.user()!.oid,
          operation: 'HARDWARE - Malfunzionamento: ' + (this.requestType() === 'EXTERNAL' ? 'Esterna' : 'Interna') + ' all\'azienda',
          assetTypeCode: null,
          assetCode: this.requestAsset(),
          message: this.requestNotes(),
          clientProject: this.requestPriority() === 'EXTERNAL' ? true : false
        }
        this.apiService.postTicket(postableBrokenRequest).subscribe({
          next: () => {
            this.popupMessageService.success('Richiesta di malfunzionamento inviata con successo.');
            this.ticketStateService.notifyTicketsChanged();
          },
          error: (err) => {
            this.popupMessageService.error('Errore nell\'inzio della richiesta: ', err.message);
          }
        });
      }
    }
    else if(this.controlRequestType() === 'SOFTWARE')
    {
      if(this.controlRequest() === 'INSTALL')
      {
        const postableSoftwareRequest = {
          userCode: this.user()!.oid,
          operation: 'SOFTWARE - Installazione: ' + (this.requestType() === 'EXTERNAL' ? 'Esterna' : 'Interna') + ' all\'azienda',
          assetTypeCode: null,
          assetCode: null,
          message: this.requestNotes(),
          clientProject: this.requestPriority() === 'EXTERNAL' ? true : false
        }
        this.apiService.postTicket(postableSoftwareRequest).subscribe({
          next: () => {
            this.popupMessageService.success('Richiesta di intervento software inviata con successo.');
            this.ticketStateService.notifyTicketsChanged();
          },
          error: (err) => {
            this.popupMessageService.error('Errore nell\'inzio della richiesta: ', err.message);
          }
        });
      }
      else if(this.controlRequest() === 'CONFIGURATION')
      {
      const postableSoftwareRequest = {
        userCode: this.user()!.oid,
        operation: 'SOFTWARE - Configurazione: ' + (this.requestType() === 'EXTERNAL' ? 'Esterna' : 'Interna') + ' all\'azienda',
        assetTypeCode: null,
        assetCode: null,
        message: this.requestNotes(),
        clientProject: this.requestPriority() === 'EXTERNAL' ? true : false
      }
      this.apiService.postTicket(postableSoftwareRequest).subscribe({
        next: () => {
          this.popupMessageService.success('Richiesta di intervento software inviata con successo.');
          this.ticketStateService.notifyTicketsChanged();
        },
        error: (err) => {
          this.popupMessageService.error('Errore nell\'inzio della richiesta: ', err.message);
        }
      });
    }
    else if(this.controlRequest() === 'BROKEN')
    {
      const postableBrokenRequest = {
        userCode: this.user()!.oid,
        operation: 'SOFTWARE - Malfunzionamento: ' + (this.requestType() === 'EXTERNAL' ? 'Esterna' : 'Interna') + ' all\'azienda',
        assetTypeCode: null,
        assetCode: null,
        message: this.requestNotes(),
        clientProject: this.requestPriority() === 'EXTERNAL' ? true : false
      }
      this.apiService.postTicket(postableBrokenRequest).subscribe({
        next: () => {
          this.popupMessageService.success('Richiesta di malfunzionamento inviata con successo.');
          this.ticketStateService.notifyTicketsChanged();
        },
        error: (err) => {
          this.popupMessageService.error('Errore nell\'inzio della richiesta: ', err.message);
        }
      });
    }
  }
    else if(this.controlRequestType() === 'NETWORK')
    {
      const postableNetworkRequest = {
        userCode: this.user()!.oid,
        operation: 'RETE: ' + (this.requestType() === 'EXTERNAL' ? 'Esterna' : 'Interna') + ' all\'azienda',
        assetTypeCode: null,
        assetCode: null,
        message: this.requestNotes(),
        clientProject: this.requestPriority() === 'EXTERNAL' ? true : false
      }
      this.apiService.postTicket(postableNetworkRequest).subscribe({
        next: () => {
          this.popupMessageService.success('Richiesta di intervento rete inviata con successo.');
          this.ticketStateService.notifyTicketsChanged();
        },
        error: (err) => {
          this.popupMessageService.error('Errore nell\'inzio della richiesta: ', err.message);
        }
      });
    }
    else{
      this.popupMessageService.error('Errore nell\'inserimento dei valori.');
    }
    /*if(this.requestType() !== '' && this.requestAsset() === ''){
      const requestTypeId = this.assetTypes().find(type => type.name === this.requestType())?.code;

      const postableAssignedRequest = {
        userCode: this.user()!.oid,
        operation: 'ASSIGNED',
        assetTypeCode: requestTypeId,
        assetCode: null,
        message: this.requestNotes(),
        //status: 'OPEN',
        //priority: this.requestPriority()
      }
      this.apiService.postTicket(postableAssignedRequest).subscribe({
        next: () => {
          this.popupMessageService.success('Richiesta di assegnazione inviata con successo.');
          this.ticketStateService.notifyTicketsChanged();
        },
        error: (err) => {
          this.popupMessageService.error('Errore nell\'inzio della richiesta: ', err.message);
        }
      });
    }
    else if(this.requestType() === '' && this.requestAsset() !== ''){
      console.log(this.requestAsset());
      if(this.controlRequestType() === 'DISMISSIONE'){
        const postableDismissedRequest = {
          userCode: this.user()!.oid,
          operation: 'DISMISSED',
          assetTypeCode: null,
          assetCode: this.requestAsset(),
          message: this.requestNotes(),
          //status: 'OPEN',
          //priority: this.requestPriority()
        }
        this.apiService.postTicket(postableDismissedRequest).subscribe({
          next: () => {
            this.popupMessageService.success('Richiesta di dismissione inviata con successo.');
            this.ticketStateService.notifyTicketsChanged();
          },
          error: (err) => {
            this.popupMessageService.error('Errore nell\'inzio della richiesta: ', err.message);
          }
        });
      }
      else if(this.controlRequestType() === 'RICONSEGNA'){
        console.log(this.requestAsset());
        const postableReturnedRequest = {
          userCode: this.user()!.oid,
          operation: 'RETURNED',
          assetTypeCode: null,
          assetCode: this.requestAsset(),
          message: this.requestNotes(),
          //status: 'OPEN',
          //priority: this.requestPriority()
        }
        this.apiService.postTicket(postableReturnedRequest).subscribe({
          next: () => {
            this.popupMessageService.success('Richiesta di riconsegna inviata con successo.');
            this.ticketStateService.notifyTicketsChanged();
          },
          error: (err) => {
            this.popupMessageService.error('Errore nell\'inzio della richiesta: ', err.message);
          }
        });
      }
    }*/
    this.controlRequestType.set('');
    this.requestNotes.set('');
    this.requestType.set('');
    this.requestAsset.set('');
    //this.requestPriority.set('');
    
    this.askDialog.nativeElement.close();
  }
  onViewTickets(){
    this.router.navigate([`/user-standard/${this.user()?.oid}/ticket`]);
  }
  onLogout() {
    this.authService.logout();
  }

  themeToggleLabel(): string {
    return this.isDarkTheme() ? 'Tema chiaro' : 'Tema scuro';
  }

  onToggleTheme(): void {
    if (typeof document === 'undefined') {
      return;
    }

    const nextIsDark = !this.isDarkTheme();
    document.body.classList.toggle('theme-dark', nextIsDark);
    this.isDarkTheme.set(nextIsDark);

    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(UserStandard.THEME_STORAGE_KEY, nextIsDark ? 'dark' : 'light');
    }
  }
}