 import { Component, computed, DestroyRef, ElementRef, inject, signal, ViewChild } from '@angular/core';
 import { ActivatedRoute, Router } from "@angular/router";
import { ApiService } from '../../../services/api';
import { User, MovementByuserID } from '../../../models/user.model';
import { DatePipe } from '@angular/common';
import { forkJoin, Subject } from 'rxjs';
import { PaginationComponent } from "../../../shared/components/pagination/pagination";
import { ButtonComponent } from "../../../shared/components/button/button";
import { PopupMessageService } from '../../../shared/services/popup-message.service';
import { AssetType } from '../../../shared/services/asset-type.service';

@Component({
  selector: 'app-user-standard',
  imports: [DatePipe, PaginationComponent, ButtonComponent],
  templateUrl: './user-standard.html',
  styleUrl: './user-standard.css',
})
export class UserStandard{
  private destroyRef = inject(DestroyRef);
  user = signal<User | null>(null);
  users = signal<User[]>([]);
  assetTypes = signal<AssetType[]>([]);
  movements = signal<MovementByuserID[]>([]);
  unmergedMovement: MovementByuserID[] = ([]);
  downloadableMovement: MovementByuserID|null = null;

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

  //request per prendere tutte le info
  constructor(private apiService: ApiService,
    private route: ActivatedRoute,
    private router: Router,
    private readonly popupMessageService: PopupMessageService
  ) {
  const id = this.route.snapshot.paramMap.get('id');

  if (!id || isNaN(+id)) {
    this.router.navigate(['/404']);
    return;
  }

  const subscription = forkJoin({
    user: this.apiService.getUsersById(+id),
    users: this.apiService.getUsers(),
    assetType: this.apiService.getAssetTypes(),
    movements: this.apiService.getMovementByUserId(+id),
  }).subscribe({
    next: ({ user, users, assetType, movements }) => {
      this.user.set(user ?? {});
      this.users.set(users ?? []);
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
      this.users.set([]);
      this.assetTypes.set([]);
      this.movements.set([]);
      this.unmergedMovement = [];
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
    this.askDialog.nativeElement.close();
  }
  onAskDialogBackdropClick(event: MouseEvent): void {
    this.onCloseAskDialog();
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
  onLogout() {
    this.router.navigate(['/login']);
  }
}