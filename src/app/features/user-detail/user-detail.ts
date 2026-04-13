import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink, RouterLinkActive } from "@angular/router";
import { ApiService } from '../../services/api';
import { AssetService } from '../../shared/services/asset.service';
import { User, MovementByuserID } from '../../models/user.model';
import { DatePipe } from '@angular/common';
import { forkJoin } from 'rxjs';
import { Asset } from '../../shared/models/asset.interface';
import { AssetType } from '../../shared/services/asset-type.service';
import { PaginationComponent } from "../../shared/components/pagination/pagination";
import { PopupMessageService } from '../../shared/services/popup-message.service';

@Component({
  selector: 'app-user-detail',
  imports: [RouterLink, RouterLinkActive, DatePipe, PaginationComponent],
  templateUrl: './user-detail.html',
  styleUrl: './user-detail.css',
})
export class UserDetail implements OnInit{
  user = signal<User | null>(null);
  movements = signal<MovementByuserID[]>([]);

  assets = signal<Asset[]>([]);
  assetTypes = signal<AssetType[]>([]);

  loading = signal(true);
  destroyRef = inject(DestroyRef);

  //serie di computed che ottengono le informazioni dell'utente e le rendono visuabilizzabili
  fullName = computed(() => {
    const user = this.user();
    if (!user) return '';
    return `${user.name} ${user.surname}`;
  });
  businessUnit = computed(() => {
    const user = this.user();
    if (!user) return '';
    return `${user.businessUnit.name}`;
  });
  email = computed(() => {
    const user = this.user();
    if (!user) return '';
    return `${user.email}`;
  });
  phoneNumber = computed(() => {
    const user = this.user();
    if (!user) return '';
    return `${user.phoneNumber.slice(0, 3)} ${user.phoneNumber.slice(3, 6)} ${user.phoneNumber.slice(6, 10)}`;
  });

  //request che permette di ottenere user e i suoi movement
  constructor(private apiService: ApiService,
    public route: ActivatedRoute,
    private assetService: AssetService,
    private router: Router,
    private readonly popupMessageService: PopupMessageService
  ){
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;
    const subscription = forkJoin({
      user: this.apiService.getUsersById(+id),
      movements: this.apiService.getMovementByUserId(+id)
    }).subscribe({
      next: ({ user, movements }) => {
        this.user.set(user ?? {});
        this.movements.set(movements ?? []);
        // const processed = this.mergeMovements(movements ?? []);
        // this.movements.set(processed);
        this.loading.set(false);
      },
      error: err => {
        this.popupMessageService.error('Errore nel caricamento dell\'utente');
        console.error('API error', err);
        this.user.set(null);
        this.loading.set(false);
      }
    });
    this.destroyRef.onDestroy(() => subscription.unsubscribe());
  }

  //un computed che riordina i movement per essere dal piu recente al piu vecchio
  sortedMovements = computed(() =>
    [...this.movements()].sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )
  );

  //request per ottenere asset
  ngOnInit(): void {
    this.assetService.getAssets().subscribe({
      next: (data) => {
        this.assets.set(data ?? []);
      },
      error: (err) => {
        this.popupMessageService.error('Errore nel caricamento degli asset');
        console.error('Errore nel caricamento degli asset', err);
        this.assets.set([]);
      }
    });
    this.apiService.getAssetTypes().subscribe({
      next: (data) => {
        this.assetTypes.set(data ?? []);
      },
      error: (err) => {
        this.popupMessageService.error('Errore nel caricamento delle tipologie di asset');
        console.error('Errore nel caricamento delle tipologie di asset', err);
        this.assetTypes.set([]);
      }
    });
  }

  currentPage = signal(1);
  itemsPerPage = signal(3);

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

  //unisce 2 elementi della lista di movimenti che sono uno assegnato e l'altro ritornato visto che in realtà sono lo stesso asset
  // mergeMovements(movements: MovementByuserID[]): MovementByuserID[]{
  //   const toDelete = new Set<number>();

  //   const result = movements.map(move => {
  //     if (move.movementType === 'Assigned') {
  //       const returned = movements.find(
  //         m =>
  //           m.asset.serialNumber === move.asset.serialNumber &&
  //           m.movementType === 'Returned'
  //       );
  //       if (returned) {
  //         toDelete.add(returned.id);
  //         return { ...move, updateDate: returned.date };
  //       }
  //     }
  //     return move;
  //   });
  //   return result.filter(m => !toDelete.has(m.id));
  // }

  //controlla se un asset e attivo e quindi se renderlo interagibile sulla tabella
  controlActivatedAsset(code: string): boolean {
    const asset = this.assets().find(a => a.assetCode === code);
    if (!asset) return false;

    const assetType = this.assetTypes().find(t => t.name === asset.assetType);
    return assetType?.active ?? false;
  }

  //ti porta all'asset specifico se cliccato
  onNavigate(assetSerialNumber: string){
    if (!this.assets()) return;
    const asset = this.assets().find(a => a.serialNumber === assetSerialNumber);
    
    if (!asset) return;
    this.router.navigate(['assets', asset.assetCode], { relativeTo: this.route.parent });
  }
}
