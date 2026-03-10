import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink, RouterLinkActive } from "@angular/router";
import { ApiService } from '../../services/api';
import { AssetService } from '../../shared/services/asset.service';
import { User, MovementByuserID } from '../../models/user.model';
import { DatePipe } from '@angular/common';
import { forkJoin } from 'rxjs';
import { Asset } from '../../shared/models/asset.interface';
import { AssetType } from '../../shared/services/asset-type.service';

//TODO se si mettono troppi valori nel movement la sidebar segue lo scorrimento verso il basso invece di rimanere bloccata
@Component({
  selector: 'app-user-detail',
  imports: [RouterLink, RouterLinkActive, DatePipe],
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

  fullName = computed(() => {
    const user = this.user();
    if (!user) return '-';
    return `${user.name} ${user.surname}`;
  });
  businessUnit = computed(() => {
    const user = this.user();
    if (!user) return '-';
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

  constructor(private apiService: ApiService,
    public route: ActivatedRoute,
    private assetService: AssetService,
    private router: Router) {

  const id = this.route.snapshot.paramMap.get('id');
  if (!id) return;
  const subscription = forkJoin({
    user: this.apiService.getUsersById(+id),
    movements: this.apiService.getMovementByUserId(+id)
  }).subscribe({
    next: ({ user, movements }) => {
      this.user.set(user ?? {});

      const processed = this.mergeMovements(movements ?? []);
      this.movements.set(processed);
      this.loading.set(false);
    },
    error: err => {
      console.error('API error', err);
      this.user.set(null);
      this.loading.set(false);
    }
  });
  this.destroyRef.onDestroy(() => subscription.unsubscribe())
  }

  ngOnInit(): void {
    this.assetService.getAssets().subscribe({
      next: (data) => {
        this.assets.set(data ?? []);
      },
      error: (err) => {
        console.error('Errore nel caricamento degli asset', err);
        this.assets.set([]);
      }
    });
    this.apiService.getAssetTypes().subscribe({
      next: (data) => {
        this.assetTypes.set(data ?? []);
      },
      error: (err) => {
        console.error('Errore nel caricamento delle tipologie di asset', err);
        this.assetTypes.set([]);
      }
    })
  }

  mergeMovements(movements: MovementByuserID[]): MovementByuserID[]{
  const toDelete = new Set<number>();

  const result = movements.map(move => {
    if (move.movementType === 'Assigned') {
      const returned = movements.find(
        m =>
          m.asset.serialNumber === move.asset.serialNumber &&
          m.movementType === 'Returned'
      );
      if (returned) {
        toDelete.add(returned.id);
        return { ...move, updateDate: returned.date };
      }
    }
    return move;
  });
  return result.filter(m => !toDelete.has(m.id));
  }

  controlActivatedAsset(code: string): boolean {
    const asset = this.assets().find(a => a.assetCode === code);
    if (!asset) return false;
    const assetType = this.assetTypes().find(t => t.name === asset.assetType);
    return assetType?.active ?? false;
  }

  onNavigate(assetSerialNumber: string){
    if (!this.assets()) return;
    const asset = this.assets().find(a => a.serialNumber === assetSerialNumber);
    if (!asset) return;
    this.router.navigate(['assets', asset.assetCode], { relativeTo: this.route.parent });
  }
}
