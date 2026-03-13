import { Component, OnInit, signal, inject, DestroyRef, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AssignAssetModalComponent } from '../../../../shared/components/assign-asset-modal/assign-asset-modal';
import { DismissAssetModalComponent, DismissAssetForm } from '../../../../shared/components/dismiss-asset-modal/dismiss-asset-modal';
import { ReturnCertifyModalComponent, ReturnCertifyForm } from '../../components/return-certify-modal/return-certify-modal';
import { AssetDetail, AssignAssetForm, AssetMovement } from '../../../../shared/models/asset.interface';
import { AssetService } from '../../../../shared/services/asset.service';
import { AssetWorkflowService } from '../../../../shared/services/asset-workflow.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ButtonComponent } from '../../../../shared/components/button/button';

@Component({
  selector: 'app-asset-detail',
  standalone: true,
  imports: [CommonModule, AssignAssetModalComponent, ReturnCertifyModalComponent, DismissAssetModalComponent, ButtonComponent],
  templateUrl: './asset-detail.html',
  styleUrl: './asset-detail.css' // correzione: styleUrls (plurale)
})
export class AssetDetailComponent implements OnInit {
  private static readonly ADMIN_USER_ID = 1;

  // --- Signals (stato reattivo)
  assetId = signal<string>('');                // codice asset
  asset = signal<AssetDetail | null>(null);   // dettaglio asset
  isLoading = signal<boolean>(true);          // loading indicator
  showAssignModal = signal<boolean>(false);   // apertura modale assegnazione
  showReturnModal = signal<boolean>(false);
  showDismissModal = signal<boolean>(false);
  movementState = signal({
    data: [] as AssetMovement[],
    loading: true,
    expandedId: null as string | null
  });

  // --- Abilitazione bottoni in base allo stato
  canAssign = computed(() => this.asset()?.status === 'Available');
  canCertifyReturn = computed(() => this.asset()?.status === 'Assigned');
  canDismiss = computed(() => this.asset()?.status === 'Available');
  assetSummary = computed(() => {
    const current = this.asset();
    if (!current) {
      return '';
    }
    const label = [current.brand, current.model].filter(Boolean).join(' ');
    if (!current.serialNumber) {
      return label;
    }
    return `${label} - ${current.serialNumber}`;
  });

  // --- DestroyRef per takeUntilDestroyed
  private readonly destroyRef: DestroyRef = inject(DestroyRef);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private assetService: AssetService,
    private assetWorkflowService: AssetWorkflowService
  ) {}

  ngOnInit(): void {
    // Prende il "code" dell'asset dall'URL (rota dinamica)
    this.route.params.subscribe(params => {
      const code = params['assetCode'];
      this.assetId.set(code);

      // Carica i dati principali in parallelo
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
    this.movementState.update(state => ({
      ...state,
      loading: true
    }));
    this.assetService.getAssetMovements(code)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (movements) => {
          // Mantiene l'eventuale riga espansa dopo il refresh
          this.movementState.set({
            data: movements,
            loading: false,
            expandedId: this.movementState().expandedId
          });
        },
        error: (err) => {
          console.error('Errore caricamento movimenti:', err);
          this.movementState.update(state => ({
            ...state,
            data: [],
            loading: false
          }));
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
    const current = this.asset();
    if (!current) {
      return;
    }

    const userId = Number(formData.userId);
    if (!Number.isFinite(userId)) {
      alert('Utente non valido');
      return;
    }

    this.assetWorkflowService.assignAsset(current, {
      userId,
      notes: formData.notes
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          alert(`Asset assegnato a ${formData.userName}`);
          this.closeAssignModal();
          this.loadAssetDetail(this.assetId());
          this.loadAssetMovements(this.assetId());
        },
        error: err => {
          console.error('Errore assegnazione asset:', err);
          alert('Errore durante l\'assegnazione dell\'asset');
        }
      });
  }

  // --- Certifica ritorno
  certifyReturn(): void {
    if (!this.canCertifyReturn()) {
      return;
    }
    this.showReturnModal.set(true);
  }

  closeReturnModal(): void {
    this.showReturnModal.set(false);
  }

  onReturnCertified(formData: ReturnCertifyForm): void {
    const current = this.asset();
    if (!current) {
      return;
    }

    const returnUserId = this.getReturnMovementUserId();

    this.assetWorkflowService.certifyReturn(current, {
      notes: formData.notes,
      userId: returnUserId
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          alert('Riconsegna certificata con successo');
          this.closeReturnModal();
          this.loadAssetDetail(this.assetId());
          this.loadAssetMovements(this.assetId());
        },
        error: err => {
          console.error('Errore certificazione riconsegna:', err);
          alert('Errore durante la certificazione della riconsegna');
        }
      });
  }

  private getReturnMovementUserId(): number {
    const assignedMovements = this.movementState().data.filter(
      movement => movement.movementType === 'Assigned'
    );

    if (!assignedMovements.length) {
      return AssetDetailComponent.ADMIN_USER_ID;
    }

    // Usa il movimento Assigned piu recente in base all'ID progressivo backend.
    const latestAssigned = assignedMovements.reduce((latest, current) => {
      const latestId = Number(latest.id);
      const currentId = Number(current.id);
      if (Number.isFinite(latestId) && Number.isFinite(currentId)) {
        return currentId > latestId ? current : latest;
      }
      return current;
    });

    const candidateId = Number(latestAssigned.userId);
    return Number.isFinite(candidateId) ? candidateId : AssetDetailComponent.ADMIN_USER_ID;
  }

  // --- Dismetti asset
  dismissAsset(): void {
    if (!this.canDismiss()) {
      return;
    }
    this.showDismissModal.set(true);
  }

  closeDismissModal(): void {
    this.showDismissModal.set(false);
  }

  onDismissConfirmed(formData: DismissAssetForm): void {
    const current = this.asset();
    if (!current) {
      return;
    }

    this.assetWorkflowService.dismissAsset(current, {
      reason: formData.reason,
      reasonLabel: formData.reason,
      notes: formData.notes,
      userId: AssetDetailComponent.ADMIN_USER_ID
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.closeDismissModal();
          alert('Asset dismesso con successo');
          this.loadAssetDetail(this.assetId());
          this.loadAssetMovements(this.assetId());
        },
        error: err => {
          console.error('Errore dismissione asset:', err);
          alert('Errore durante la dismissione dell\'asset');
        }
      });
  }

  // --- Dettaglio movimento
  goToMovementDetail(movementId: string): void {
    const current = this.movementState().expandedId;
    // Toggle: se clicchi la stessa riga, si chiude
    this.movementState.update(state => ({
      ...state,
      expandedId: current === movementId ? null : movementId
    }));
  }

  isMovementExpanded(movementId: string): boolean {
    return this.movementState().expandedId === movementId;
  }

  // --- Helper per classi CSS sullo stato
  getStatusClass(): string {
    const status = this.asset()?.status;
    switch (status) {
      case 'Assigned': return 'status-assigned';
      case 'Available': return 'status-available';
      case 'Dismissed': return 'status-dismissed';
      case 'Unavailable': return 'status-unavailable';
      default: return '';
    }
  }
}
