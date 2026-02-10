import { Component, OnInit, signal, inject, DestroyRef, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AssignAssetModalComponent } from '../../../../shared/components/assign-asset-modal/assign-asset-modal';
import { AssetDetail, AssignAssetForm, AssetMovement } from '../../../../shared/models/asset.interface';
import { AssetService } from '../../../../shared/services/asset.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-asset-detail',
  standalone: true,
  imports: [CommonModule, AssignAssetModalComponent],
  templateUrl: './asset-detail.html',
  styleUrl: './asset-detail.css' // correzione: styleUrls (plurale)
})
export class AssetDetailComponent implements OnInit {

  // --- Signals (stato reattivo)
  assetId = signal<string>('');                // codice asset
  asset = signal<AssetDetail | null>(null);   // dettaglio asset
  movements = signal<AssetMovement[]>([]);    // movimenti asset
  isLoading = signal<boolean>(true);          // loading indicator
  isMovementsLoading = signal<boolean>(true);
  showAssignModal = signal<boolean>(false);   // apertura modale assegnazione
  expandedMovementId = signal<string | null>(null);

  // --- Abilitazione bottoni in base allo stato
  canAssign = computed(() => this.asset()?.status === 'Available');
  canCertifyReturn = computed(() => this.asset()?.status === 'Assigned');
  canDismiss = computed(() => this.asset()?.status === 'Available');

  // --- DestroyRef per takeUntilDestroyed
  private readonly destroyRef: DestroyRef = inject(DestroyRef);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private assetService: AssetService
  ) {}

  ngOnInit(): void {
    // Prende il "code" dell'asset dall'URL
    this.route.params.subscribe(params => {
      const code = params['assetCode'];
      this.assetId.set(code);

      // Chiama API 
      this.loadAssetDetail(code);
      this.loadAssetMovements(code);
    });
  }

  // --- Funzione principale: carica i dettagli dell'asset
  private loadAssetDetail(code: string): void {
    this.isLoading.set(true);

    this.assetService.getAssetByCode(code)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (asset) => {
          this.asset.set(asset);
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error('Errore caricamento asset:', err);
          this.asset.set(null); // se errore, asset = null
          this.isLoading.set(false);
        }
      });
  }

  // --- Carica movimenti asset
  private loadAssetMovements(code: string): void {
    this.isMovementsLoading.set(true);
    this.assetService.getAssetMovements(code)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (movements) => {
          this.movements.set(movements);
          this.isMovementsLoading.set(false);
        },
        error: (err) => {
          console.error('Errore caricamento movimenti:', err);
          this.movements.set([]);
          this.isMovementsLoading.set(false);
        }
      });
  }

  // --- Navigazione
  goBack(): void {
    this.router.navigate(['/assets']);
  }

  // --- Modale assegnazione
  assignAsset(): void {
    if (!this.canAssign()) {
      return;
    }
    this.showAssignModal.set(true);
  }

  closeAssignModal(): void {
    this.showAssignModal.set(false);
  }

  onAssetAssigned(formData: AssignAssetForm): void {
    console.log('Asset assegnato:', formData);
    // TODO: chiamata API per assegnazione asset
    alert(`Asset assegnato a ${formData.userName} il ${formData.assignmentDate}`);

    this.closeAssignModal();
    this.loadAssetDetail(this.assetId()); // ricarica i dettagli
  }

  // --- Certifica ritorno
  certifyReturn(): void {
    if (!this.canCertifyReturn()) {
      return;
    }
    console.log('Certifica ritorno:', this.assetId());
    alert('Funzionalità "Certifica Riconsegna" in sviluppo');
  }

  // --- Dismetti asset
  dismissAsset(): void {
    if (!this.canDismiss()) {
      return;
    }
    if (confirm('Sei sicuro di voler dismettere questo asset? Operazione irreversibile.')) {
      console.log('Dismetti asset:', this.assetId());
      alert('Asset dismesso con successo');
      this.goBack();
    }
  }

  // --- Dettaglio movimento
  goToMovementDetail(movementId: string): void {
    const current = this.expandedMovementId();
    this.expandedMovementId.set(current === movementId ? null : movementId);
  }

  isMovementExpanded(movementId: string): boolean {
    return this.expandedMovementId() === movementId;
  }

  // --- Helper per classi CSS sullo stato
  getStatusClass(): string {
    const status = this.asset()?.status;
    switch (status) {
      case 'Assigned': return 'status-assigned';
      case 'Available': return 'status-available';
      case 'Dismissed': return 'status-dismissed';
      default: return '';
    }
  }
}
