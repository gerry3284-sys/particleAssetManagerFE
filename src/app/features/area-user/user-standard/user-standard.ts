 import { Component, computed, DestroyRef, ElementRef, inject, signal, ViewChild } from '@angular/core';
 import { FormsModule } from "@angular/forms";
 import { ActivatedRoute, Router } from "@angular/router";
import { ApiService } from '../../../services/api';
import { User, MovementByuserID } from '../../../models/user.model';
import { DatePipe } from '@angular/common';
import { forkJoin } from 'rxjs';
import { PaginationComponent } from "../../../shared/components/pagination/pagination";
import { ButtonComponent } from "../../../shared/components/button/button";
import { PopupMessageService } from '../../../shared/services/popup-message.service';
import { AssetType } from '../../../shared/services/asset-type.service';
// import { AssetStatusType } from '../../../shared/models/filter-config.interface';
import { FilterService } from '../../../shared/services/filter.service';
import { Asset } from '../../../shared/models/asset.interface';
import { AssetService } from '../../../shared/services/asset.service';
import { request } from 'http';

@Component({
  selector: 'app-user-standard',
  imports: [DatePipe, PaginationComponent, ButtonComponent, FormsModule],
  templateUrl: './user-standard.html',
  styleUrl: './user-standard.css',
})
export class UserStandard{
  private destroyRef = inject(DestroyRef);
  user = signal<User | null>(null);
  // users = signal<User[]>([]);
  // assetStatusTypes = signal<AssetStatusType[]>([]);
  assetTypes = signal<AssetType[]>([]);
  movements = signal<MovementByuserID[]>([]);
  assets = signal<Asset[]>([]);
  unmergedMovement: MovementByuserID[] = ([]);
  downloadableMovement: MovementByuserID|null = null;


  controlRequest = signal<string>('');
  requestNotes = signal<string>('');
  requestType = signal<string>('');
  requestAsset = signal<string>('');

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
    const user = this.user();
    if (!user) return [];
    return this.assets().filter(asset => asset.assignedUser === user.name);
  });

  //request per prendere tutte le info
  constructor(private apiService: ApiService,
    private route: ActivatedRoute,
    private router: Router,
    private readonly popupMessageService: PopupMessageService,
    private assetService: AssetService
  ) {
  const id = this.route.snapshot.paramMap.get('id');

  if (!id || isNaN(+id)) {
    this.router.navigate(['/404']);
    return;
  }

  const subscription = forkJoin({
    user: this.apiService.getUsersById(+id),
    // assetStatusType: this.filterService.getAssetStatusTypes(false),
    assetType: this.apiService.getAssetTypes(),
    movements: this.apiService.getMovementByUserId(+id),
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
    this.controlRequest.set('');
    this.requestNotes.set('');
    this.requestType.set('');
    this.requestAsset.set('');
    
    this.askDialog.nativeElement.close();
  }
  onAskDialogBackdropClick(){
    this.onCloseAskDialog();
  }
  isInvalid(): boolean {
    if(this.controlRequest() !==''){
      if(this.controlRequest() === 'ASSEGNAZIONE'){
        if(this.requestType() === '' || this.requestNotes() === '') return true;
        return false;
      }
      else if(this.controlRequest() === 'DISMISSIONE' || this.controlRequest() === 'RIPARAZIONE'){
        if(this.requestAsset() === '' || this.requestNotes() === '') return true;
        return false;
      }
      else return true;
    }
    else {return true};
  }
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
  onsendRequest(){
    console.log('Request type:', this.controlRequest(), 'Request notes:', this.requestNotes(), 'Request asset type:', this.requestType(), 'Request asset:', this.requestAsset());
    this.askDialog.nativeElement.close();
  }
  onLogout() {
    this.router.navigate(['/login']);
  }
}