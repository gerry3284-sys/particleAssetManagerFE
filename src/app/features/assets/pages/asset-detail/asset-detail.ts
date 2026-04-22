import { Component, OnInit, signal, inject, DestroyRef, computed } from '@angular/core';
import { CommonModule, DOCUMENT, isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID, effect } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { AssignAssetModalComponent } from '../../../../shared/components/assign-asset-modal/assign-asset-modal';
import { DismissAssetModalComponent, DismissAssetForm } from '../../../../shared/components/dismiss-asset-modal/dismiss-asset-modal';
import { ReturnCertifyModalComponent, ReturnCertifyForm } from '../../components/return-certify-modal/return-certify-modal';
import { AssetDetail, AssignAssetForm, AssetMovement } from '../../../../shared/models/asset.interface';
import { AssetService } from '../../../../shared/services/asset.service';
import { AssetWorkflowService } from '../../../../shared/services/asset-workflow.service';
import { PopupMessageService } from '../../../../shared/services/popup-message.service';
import { AssignmentReceiptPdfData, AssignmentReceiptPdfService } from '../../../../shared/services/assignment-receipt-pdf.service';
import { ReturnReceiptPdfData, ReturnReceiptPdfService } from '../../../../shared/services/return-receipt-pdf.service';
import { DismissReceiptPdfData, DismissReceiptPdfService } from '../../../../shared/services/dismiss-receipt-pdf.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ButtonComponent } from '../../../../shared/components/button/button';
import { FilterService } from '../../../../shared/services/filter.service';
import {
  AssetType as FilterAssetType,
  BusinessUnit as FilterBusinessUnit,
  AssetStatusType
} from '../../../../shared/models/filter-config.interface';

type ReceiptBannerState = {
  type: 'success' | 'error';
  message: string;
};

type PendingAssetEditPayload = {
  brand: string;
  model: string;
  serialNumber: string;
  note: string;
  hardDisk: string;
  businessUnitCode: string;
  assetTypeCode: string;
  ram: number;
};

@Component({
  selector: 'app-asset-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AssignAssetModalComponent, ReturnCertifyModalComponent, DismissAssetModalComponent, ButtonComponent],
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
  showAssignmentReceiptPrompt = signal<boolean>(false);
  showReturnModal = signal<boolean>(false);
  showReturnReceiptPrompt = signal<boolean>(false);
  showDismissModal = signal<boolean>(false);
  showDismissReceiptPrompt = signal<boolean>(false);
  showEditAssetModal = signal<boolean>(false);
  showEditConfirmModal = signal<boolean>(false);
  savingEditAsset = signal<boolean>(false);
  settingMaintenanceStatus = signal<boolean>(false);
  settingAvailableStatus = signal<boolean>(false);
  loadingEditOptions = signal<boolean>(false);
  pendingAssetEditPayload = signal<PendingAssetEditPayload | null>(null);
  pendingAssignmentReceipt = signal<AssignmentReceiptPdfData | null>(null);
  pendingReturnReceipt = signal<ReturnReceiptPdfData | null>(null);
  pendingDismissReceipt = signal<DismissReceiptPdfData | null>(null);
  assignmentReceiptBanner = signal<ReceiptBannerState>({
    type: 'success',
    message: 'Assegnazione registrata correttamente.'
  });
  returnReceiptBanner = signal<ReceiptBannerState>({
    type: 'success',
    message: 'Riconsegna registrata correttamente.'
  });
  dismissReceiptBanner = signal<ReceiptBannerState>({
    type: 'success',
    message: 'Dismissione registrata correttamente.'
  });
  downloadingMovementReceiptId = signal<string | null>(null);
  businessUnitOptions = signal<FilterBusinessUnit[]>([]);
  assetTypeOptions = signal<FilterAssetType[]>([]);
  editAssetTypeCode = signal<string>('');
  editAssetForm = new FormGroup({
    brand: new FormControl('', { nonNullable: true }),
    model: new FormControl('', { nonNullable: true }),
    serialNumber: new FormControl('', { nonNullable: true }),
    note: new FormControl('', { nonNullable: true }),
    hardDisk: new FormControl('', { nonNullable: true }),
    businessUnitCode: new FormControl('', { nonNullable: true }),
    assetTypeCode: new FormControl('', { nonNullable: true }),
    ram: new FormControl('', { nonNullable: true })
  });
  movementState = signal({
    data: [] as AssetMovement[],
    loading: true,
    expandedId: null as string | null
  });

  // --- Abilitazione bottoni in base allo stato
  canAssign = computed(() => this.asset()?.status === 'Available');
  canCertifyReturn = computed(() => this.asset()?.status === 'Assigned');
  canDismiss = computed(() => this.asset()?.status === 'Available');
  canSetMaintenance = computed(() => this.asset()?.status === 'Available');
  canSetAvailable = computed(() => this.asset()?.status === 'UnderMaintenance');
  canEditAsset = computed(() => {
    const status = this.asset()?.status;
    return status !== 'Assigned' && status !== 'Dismissed';
  });
  editSelectedAssetType = computed(() => {
    const selectedCode = this.editAssetTypeCode();
    if (!selectedCode) {
      return null;
    }

    return this.assetTypeOptions().find(type => (type.code ?? type.name) === selectedCode) ?? null;
  });
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
  anyModalOpen = computed(() =>
    this.showAssignModal()
    || this.showReturnModal()
    || this.showDismissModal()
    || this.showEditAssetModal()
    || this.showEditConfirmModal()
    || this.showAssignmentReceiptPrompt()
    || this.showReturnReceiptPrompt()
    || this.showDismissReceiptPrompt()
  );

  // --- DestroyRef per takeUntilDestroyed
  private readonly destroyRef: DestroyRef = inject(DestroyRef);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly documentRef = inject(DOCUMENT);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private assetService: AssetService,
    private assetWorkflowService: AssetWorkflowService,
    private popupMessageService: PopupMessageService,
    private filterService: FilterService,
    private assignmentReceiptPdfService: AssignmentReceiptPdfService,
    private returnReceiptPdfService: ReturnReceiptPdfService,
    private dismissReceiptPdfService: DismissReceiptPdfService
  ) {
    this.editAssetForm.controls.assetTypeCode.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(value => {
        this.editAssetTypeCode.set((value ?? '').trim());
        this.syncEditTechnicalFieldsByType();
      });

    effect((onCleanup) => {
      if (!isPlatformBrowser(this.platformId)) {
        return;
      }

      if (!this.anyModalOpen()) {
        return;
      }

      const previousOverflow = this.documentRef.body.style.overflow;
      this.documentRef.body.style.overflow = 'hidden';

      onCleanup(() => {
        this.documentRef.body.style.overflow = previousOverflow;
      });
    });
  }

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

  openEditAssetModal(): void {
    if (!this.canEditAsset()) {
      return;
    }

    const current = this.asset();
    if (!current) {
      return;
    }

    this.editAssetForm.setValue({
      brand: current.brand || '',
      model: current.model || '',
      serialNumber: current.serialNumber || '',
      note: current.notes === '-' ? '' : (current.notes || ''),
      hardDisk: current.hardDisk || '',
      businessUnitCode: current.businessUnitCode || '',
      assetTypeCode: current.assetTypeCode || '',
      ram: current.ram != null ? String(current.ram) : ''
    });
    this.editAssetTypeCode.set(current.assetTypeCode || '');

    this.showEditAssetModal.set(true);

    if (this.businessUnitOptions().length && this.assetTypeOptions().length) {
      this.syncEditTechnicalFieldsByType();
      return;
    }

    this.loadingEditOptions.set(true);
    this.filterService.getBusinessUnits()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: units => {
          this.businessUnitOptions.set(units.filter(unit => !!unit.code));

          this.filterService.getAssetTypes()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
              next: types => {
                this.assetTypeOptions.set(types.filter(type => !!type.code));
                this.applyFallbackCodesFromOptions();
                this.loadingEditOptions.set(false);
              },
              error: err => {
                console.error('Errore caricamento tipologie asset:', err);
                this.popupMessageService.error('Impossibile caricare le tipologie asset');
                this.loadingEditOptions.set(false);
              }
            });
        },
        error: err => {
          console.error('Errore caricamento business unit:', err);
          this.popupMessageService.error('Impossibile caricare le business unit');
          this.loadingEditOptions.set(false);
        }
      });
  }

  closeEditAssetModal(): void {
    if (this.savingEditAsset()) {
      return;
    }
    this.showEditConfirmModal.set(false);
    this.pendingAssetEditPayload.set(null);
    this.showEditAssetModal.set(false);
  }

  saveAssetChanges(): void {
    const current = this.asset();
    if (!current) {
      return;
    }

    const form = this.editAssetForm.getRawValue();
    const brand = form.brand.trim();
    const model = form.model.trim();
    const serialNumber = form.serialNumber.trim();
    const businessUnitCode = form.businessUnitCode.trim();
    const assetTypeCode = form.assetTypeCode.trim();

    if (!brand || !model || !serialNumber || !businessUnitCode || !assetTypeCode) {
      this.popupMessageService.error('Compila tutti i campi obbligatori');
      return;
    }

    const parsedRam = Number(form.ram);
    const requiresRam = !!this.editSelectedAssetType()?.ram;
    const requiresHardDisk = !!this.editSelectedAssetType()?.hardDisk;
    const ram = requiresRam && Number.isFinite(parsedRam) ? parsedRam : 0;
    const hardDisk = requiresHardDisk ? form.hardDisk.trim() : '';

    this.pendingAssetEditPayload.set({
      brand,
      model,
      serialNumber,
      note: form.note.trim(),
      hardDisk,
      businessUnitCode,
      assetTypeCode,
      ram
    });
    this.showEditConfirmModal.set(true);
  }

  closeEditConfirmModal(): void {
    if (this.savingEditAsset()) {
      return;
    }

    this.showEditConfirmModal.set(false);
  }

  confirmSaveAssetChanges(): void {
    const current = this.asset();
    const payload = this.pendingAssetEditPayload();
    if (!current || !payload) {
      this.showEditConfirmModal.set(false);
      return;
    }

    this.savingEditAsset.set(true);
    this.showEditConfirmModal.set(false);
    this.assetService.updateAsset(current.assetCode, payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.popupMessageService.success('Asset aggiornato con successo');
          this.pendingAssetEditPayload.set(null);
          this.showEditAssetModal.set(false);
          this.loadAssetDetail(this.assetId());
          this.savingEditAsset.set(false);
        },
        error: err => {
          console.error('Errore aggiornamento asset:', err);
          this.popupMessageService.error('Errore durante il salvataggio delle modifiche');
          this.pendingAssetEditPayload.set(null);
          this.savingEditAsset.set(false);
        }
      });
  }

  private applyFallbackCodesFromOptions(): void {
    const current = this.asset();
    if (!current) {
      return;
    }

    const form = this.editAssetForm.getRawValue();
    const businessUnitCode = form.businessUnitCode ||
        this.businessUnitOptions().find(unit => unit.name === current.businessUnit)?.code ||
        '';
    const assetTypeCode = form.assetTypeCode ||
        this.assetTypeOptions().find(type => type.name === current.assetType)?.code ||
        '';

    this.editAssetForm.patchValue({
      businessUnitCode,
      assetTypeCode
    }, { emitEvent: false });
    this.editAssetTypeCode.set(assetTypeCode);

    this.syncEditTechnicalFieldsByType();
  }

  private syncEditTechnicalFieldsByType(): void {
    const selectedType = this.editSelectedAssetType();
    if (!selectedType) {
      return;
    }

    const requiresRam = !!selectedType.ram;
    const requiresHardDisk = !!selectedType.hardDisk;
    const currentRam = this.editAssetForm.controls.ram.value;
    const currentHardDisk = this.editAssetForm.controls.hardDisk.value;

    this.editAssetForm.patchValue({
      ram: requiresRam ? currentRam : '',
      hardDisk: requiresHardDisk ? currentHardDisk : ''
    }, { emitEvent: false });
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
      this.popupMessageService.error('Utente non valido');
      return;
    }

    const assignmentReceiptData = {
      assetType: current.assetType,
      brand: current.brand,
      model: current.model,
      serialNumber: current.serialNumber,
      userName: formData.userName,
      assignmentDate: new Date(),
      assignmentNotes: formData.notes?.trim() || ''
    };

    void this.assignmentReceiptPdfService.generateBase64(assignmentReceiptData)
      .then(receiptBase64 => {
        const normalizedReceiptBase64 = this.normalizeReceiptBase64(receiptBase64);
        if (!normalizedReceiptBase64) {
          this.popupMessageService.error('Errore nella generazione della ricevuta PDF');
          return;
        }

        this.assetWorkflowService.assignAsset(current, {
          userId,
          notes: formData.notes,
          receiptBase64: normalizedReceiptBase64
        })
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => {
              this.closeAssignModal();
              this.pendingAssignmentReceipt.set(assignmentReceiptData);
              this.assignmentReceiptBanner.set({
                type: 'success',
                message: `L'asset e stato assegnato correttamente a ${formData.userName}.`
              });
              this.showAssignmentReceiptPrompt.set(true);
              this.loadAssetDetail(this.assetId());
              this.loadAssetMovements(this.assetId());
            },
            error: err => {
              console.error('Errore assegnazione asset:', err);
              this.popupMessageService.error('Errore durante l\'assegnazione dell\'asset');
            }
          });
      })
      .catch(err => {
        console.error('Errore generazione PDF assegnazione:', err);
        this.popupMessageService.error('Errore nella generazione della ricevuta PDF');
      });
  }

  closeAssignmentReceiptPrompt(): void {
    this.showAssignmentReceiptPrompt.set(false);
    this.pendingAssignmentReceipt.set(null);
    this.assignmentReceiptBanner.set({
      type: 'success',
      message: 'Assegnazione registrata correttamente.'
    });
  }

  downloadAssignmentReceipt(): void {
    const data = this.pendingAssignmentReceipt();
    if (!data) {
      this.closeAssignmentReceiptPrompt();
      return;
    }

    void this.assignmentReceiptPdfService.generate(data)
      .then(() => {
        this.assignmentReceiptBanner.set({
          type: 'success',
          message: 'Ricevuta scaricata con successo.'
        });
      })
      .catch(err => {
        console.error('Errore download ricevuta assegnazione:', err);
        this.assignmentReceiptBanner.set({
          type: 'error',
          message: 'Errore durante il download della ricevuta.'
        });
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

    const latestAssignedMovement = this.getLatestAssignedMovement();
    const assignedUserName = latestAssignedMovement?.user || 'Utente';
    const assignmentDate = this.toDateOrNow(latestAssignedMovement?.date);
    const returnDate = new Date();

    const returnUserId = this.getReturnMovementUserId();

    const returnReceiptData: ReturnReceiptPdfData = {
      assetType: current.assetType,
      brand: current.brand,
      model: current.model,
      serialNumber: current.serialNumber,
      userName: assignedUserName,
      assignmentDate,
      returnDate,
      returnNotes: formData.notes
    };

    void this.returnReceiptPdfService.generateBase64(returnReceiptData)
      .then(receiptBase64 => {
        const normalizedReceiptBase64 = this.normalizeReceiptBase64(receiptBase64);
        if (!normalizedReceiptBase64) {
          this.popupMessageService.error('Errore nella generazione della ricevuta PDF');
          return;
        }

        this.certifyReturnMovement(current, {
          reason: formData.reason,
          privateEmail: formData.privateEmail,
          notes: formData.notes,
          userId: returnUserId,
          receiptBase64: normalizedReceiptBase64
        }, returnReceiptData);
      })
      .catch(err => {
        console.error('Errore generazione PDF riconsegna:', err);
        this.popupMessageService.error('Errore nella generazione della ricevuta PDF');
      });
  }

  private certifyReturnMovement(
    asset: AssetDetail,
    payload: {
      reason: 'resignation' | 'change';
      privateEmail?: string;
      notes?: string;
      userId: number;
      receiptBase64?: string;
    },
    receiptData: ReturnReceiptPdfData
  ): void {
    this.assetWorkflowService.certifyReturn(asset, payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          const successMessage = payload.reason === 'resignation'
            ? 'Riconsegna certificata e ricevuta inviata via email'
            : 'Riconsegna certificata con successo';

          this.closeReturnModal();
          this.pendingReturnReceipt.set(receiptData);
          this.returnReceiptBanner.set({
            type: 'success',
            message: `${successMessage}.`
          });
          this.showReturnReceiptPrompt.set(true);
          this.loadAssetDetail(this.assetId());
          this.loadAssetMovements(this.assetId());
        },
        error: err => {
          console.error('Errore certificazione riconsegna:', err);
          this.popupMessageService.error('Errore durante la certificazione della riconsegna');
        }
      });
  }

  private getReturnMovementUserId(): number {
    const latestAssigned = this.getLatestMovementByType('Assigned');
    if (!latestAssigned) {
      return AssetDetailComponent.ADMIN_USER_ID;
    }

    const candidateId = Number(latestAssigned.userId);
    return Number.isFinite(candidateId) ? candidateId : AssetDetailComponent.ADMIN_USER_ID;
  }

  private getLatestAssignedMovement(): AssetMovement | null {
    return this.getLatestMovementByType('Assigned');
  }

  private getLatestReturnedMovement(): AssetMovement | null {
    return this.getLatestMovementByType('Returned');
  }

  private getLatestMovementByType(type: AssetMovement['movementType']): AssetMovement | null {
    return this.movementState().data.find(movement => movement.movementType === type) ?? null;
  }

  getDisplayedAssignmentDate(): string {
    const current = this.asset();
    if (!current) {
      return '-';
    }

    if (current.status === 'Assigned') {
      const latestAssigned = this.getLatestAssignedMovement();
      if (latestAssigned?.date) {
        return latestAssigned.date;
      }
    }

    return current.assignmentDate || '-';
  }

  getDisplayedAssignedUser(): string {
    const current = this.asset();
    if (!current) {
      return '-';
    }

    if (current.status === 'Assigned') {
      const latestAssigned = this.getLatestAssignedMovement();
      if (latestAssigned?.user) {
        return latestAssigned.user;
      }
    }

    return current.assignedUser || '-';
  }

  getDisplayedReturnDate(): string {
    const latestReturned = this.getLatestReturnedMovement();
    if (latestReturned?.date) {
      return latestReturned.date;
    }

    return this.asset()?.returnDate || '-';
  }

  private toDateOrNow(value?: string | null): Date {
    if (!value) {
      return new Date();
    }

    const [day, month, year] = value.split('/').map(Number);
    if (
      Number.isFinite(day)
      && Number.isFinite(month)
      && Number.isFinite(year)
      && day > 0
      && month > 0
      && year > 0
    ) {
      return new Date(year, month - 1, day);
    }

    return new Date();
  }

  formatReceiptPromptDate(value: Date): string {
    return new Intl.DateTimeFormat('it-IT', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(value);
  }

  formatReceiptPromptDateShort(value: Date): string {
    return new Intl.DateTimeFormat('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(value);
  }

  private normalizeReceiptBase64(value?: string): string {
    const raw = (value ?? '').trim();
    if (!raw) {
      return '';
    }

    const splitIndex = raw.indexOf(',');
    const base64Part = splitIndex >= 0 ? raw.slice(splitIndex + 1) : raw;
    return base64Part.replace(/\s+/g, '');
  }

  // --- Dismetti asset
  dismissAsset(): void {
    if (!this.canDismiss()) {
      return;
    }
    this.showDismissModal.set(true);
  }

  markAsMaintenance(): void {
    const current = this.asset();
    if (!current || !this.canSetMaintenance()) {
      return;
    }

    this.settingMaintenanceStatus.set(true);

    this.filterService.getAssetStatusTypes(true)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: statusTypes => {
          const maintenanceStatusCode = this.resolveMaintenanceStatusCode(statusTypes);
          if (!maintenanceStatusCode) {
            this.popupMessageService.error('Stato Manutenzione non configurato correttamente');
            this.settingMaintenanceStatus.set(false);
            return;
          }

          this.assetService.updateAssetStatus(current.assetCode, maintenanceStatusCode)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
              next: () => {
                this.popupMessageService.success('Asset impostato in manutenzione');
                this.loadAssetDetail(this.assetId());
                this.settingMaintenanceStatus.set(false);
              },
              error: err => {
                console.error('Errore aggiornamento stato a Manutenzione:', err);
                this.popupMessageService.error('Errore durante l\'aggiornamento dello stato asset');
                this.settingMaintenanceStatus.set(false);
              }
            });
        },
        error: err => {
          console.error('Errore caricamento stati asset:', err);
          this.popupMessageService.error('Impossibile verificare gli stati asset');
          this.settingMaintenanceStatus.set(false);
        }
      });
  }

  markAsAvailable(): void {
    const current = this.asset();
    if (!current || !this.canSetAvailable()) {
      return;
    }

    this.settingAvailableStatus.set(true);

    this.filterService.getAssetStatusTypes(true)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: statusTypes => {
          const availableStatusCode = this.resolveAvailableStatusCode(statusTypes);
          if (!availableStatusCode) {
            this.popupMessageService.error('Stato Disponibile non configurato correttamente');
            this.settingAvailableStatus.set(false);
            return;
          }

          this.assetService.updateAssetStatus(current.assetCode, availableStatusCode)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
              next: () => {
                this.popupMessageService.success('Asset impostato come Disponibile');
                this.loadAssetDetail(this.assetId());
                this.settingAvailableStatus.set(false);
              },
              error: err => {
                console.error('Errore aggiornamento stato a Disponibile:', err);
                this.popupMessageService.error('Errore durante l\'aggiornamento dello stato asset');
                this.settingAvailableStatus.set(false);
              }
            });
        },
        error: err => {
          console.error('Errore caricamento stati asset:', err);
          this.popupMessageService.error('Impossibile verificare gli stati asset');
          this.settingAvailableStatus.set(false);
        }
      });
  }

  private resolveAvailableStatusCode(statusTypes: AssetStatusType[]): string {
    const availableStatus = statusTypes.find(status => {
      const normalizedCode = (status.code ?? '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
      const normalizedName = (status.name ?? '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');

      return normalizedCode.startsWith('AV')
        || normalizedName.includes('AVAIL')
        || normalizedName.includes('DISPONIBIL');
    });

    return (availableStatus?.code ?? '').trim();
  }

  private resolveMaintenanceStatusCode(statusTypes: AssetStatusType[]): string {
    const maintenanceStatus = statusTypes.find(status => {
      const normalizedCode = (status.code ?? '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
      const normalizedName = (status.name ?? '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');

      return normalizedCode.startsWith('UM')
        || normalizedCode.startsWith('MA')
        || normalizedName.includes('UNDERMAINT')
        || normalizedName.includes('MAINTEN')
        || normalizedName.includes('MANUTEN');
    });

    return (maintenanceStatus?.code ?? '').trim();
  }

  closeDismissModal(): void {
    this.showDismissModal.set(false);
  }

  closeReturnReceiptPrompt(): void {
    this.showReturnReceiptPrompt.set(false);
    this.pendingReturnReceipt.set(null);
    this.returnReceiptBanner.set({
      type: 'success',
      message: 'Riconsegna registrata correttamente.'
    });
  }

  downloadReturnReceipt(): void {
    const data = this.pendingReturnReceipt();
    if (!data) {
      this.closeReturnReceiptPrompt();
      return;
    }

    void this.returnReceiptPdfService.generate(data)
      .then(() => {
        this.returnReceiptBanner.set({
          type: 'success',
          message: 'Ricevuta di riconsegna scaricata con successo.'
        });
      })
      .catch(err => {
        console.error('Errore download ricevuta riconsegna:', err);
        this.returnReceiptBanner.set({
          type: 'error',
          message: 'Errore durante il download della ricevuta.'
        });
      });
  }

  closeDismissReceiptPrompt(): void {
    this.showDismissReceiptPrompt.set(false);
    this.pendingDismissReceipt.set(null);
    this.dismissReceiptBanner.set({
      type: 'success',
      message: 'Dismissione registrata correttamente.'
    });
  }

  downloadDismissReceipt(): void {
    const data = this.pendingDismissReceipt();
    if (!data) {
      this.closeDismissReceiptPrompt();
      return;
    }

    void this.dismissReceiptPdfService.generate(data)
      .then(() => {
        this.dismissReceiptBanner.set({
          type: 'success',
          message: 'Verbale di dismissione scaricato con successo.'
        });
      })
      .catch(err => {
        console.error('Errore download verbale dismissione:', err);
        this.dismissReceiptBanner.set({
          type: 'error',
          message: 'Errore durante il download della ricevuta.'
        });
      });
  }

  onDismissConfirmed(formData: DismissAssetForm): void {
    const current = this.asset();
    if (!current) {
      return;
    }

    const dismissedDate = new Date();
    const dismissReasonLabel = this.mapDismissReasonLabel(formData.reason);
    const dismissReceiptData: DismissReceiptPdfData = {
      assetType: current.assetType,
      brand: current.brand,
      model: current.model,
      serialNumber: current.serialNumber,
      dismissedDate,
      dismissReason: dismissReasonLabel,
      dismissNotes: formData.notes,
      dismissedBy: 'Amministratore'
    };

    void this.dismissReceiptPdfService.generateBase64(dismissReceiptData)
      .then(receiptBase64 => {
        const normalizedReceiptBase64 = this.normalizeReceiptBase64(receiptBase64);
        if (!normalizedReceiptBase64) {
          this.popupMessageService.error('Errore nella generazione della ricevuta PDF');
          return;
        }

        this.assetWorkflowService.dismissAsset(current, {
          reason: formData.reason,
          reasonLabel: dismissReasonLabel,
          notes: formData.notes,
          userId: AssetDetailComponent.ADMIN_USER_ID,
          receiptBase64: normalizedReceiptBase64
        })
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => {
              this.closeDismissModal();
              this.pendingDismissReceipt.set(dismissReceiptData);
              this.dismissReceiptBanner.set({
                type: 'success',
                message: 'L\'asset e stato dismesso correttamente.'
              });
              this.showDismissReceiptPrompt.set(true);
              this.loadAssetDetail(this.assetId());
              this.loadAssetMovements(this.assetId());
            },
            error: err => {
              console.error('Errore dismissione asset:', err);
              this.popupMessageService.error('Errore durante la dismissione dell\'asset');
            }
          });
      })
      .catch(err => {
        console.error('Errore generazione PDF dismissione:', err);
        this.popupMessageService.error('Errore nella generazione della ricevuta PDF');
      });
  }

  private mapDismissReasonLabel(reason: string): string {
    switch ((reason || '').trim().toLowerCase()) {
      case 'obsolete':
        return 'Asset obsoleto';
      case 'broken':
        return 'Asset guasto';
      case 'other':
        return 'Altro';
      default:
        return reason;
    }
  }

  private getMovementUiKey(movement: AssetMovement, index: number): string {
    const rawId = (movement.id ?? '').trim();
    if (rawId && rawId !== 'undefined' && rawId !== 'null') {
      return rawId;
    }

    return `movement-${index}`;
  }

  movementUiKey(movement: AssetMovement, index: number): string {
    return this.getMovementUiKey(movement, index);
  }

  // --- Dettaglio movimento
  goToMovementDetail(movement: AssetMovement, index: number): void {
    const movementKey = this.getMovementUiKey(movement, index);
    const current = this.movementState().expandedId;
    // Toggle: se clicchi la stessa riga, si chiude
    this.movementState.update(state => ({
      ...state,
      expandedId: current === movementKey ? null : movementKey
    }));
  }

  isMovementExpanded(movement: AssetMovement, index: number): boolean {
    return this.movementState().expandedId === this.getMovementUiKey(movement, index);
  }

  downloadMovementReceipt(movement: AssetMovement, index: number, event?: Event): void {
    event?.stopPropagation();

    if (movement?.receiptAvailable === false) {
      this.popupMessageService.error('Ricevuta non disponibile per questo movimento');
      return;
    }

    const movementId = (movement.id ?? '').trim();
    if (!movementId || movementId === 'undefined' || movementId === 'null') {
      this.popupMessageService.error('ID movimento non disponibile: impossibile scaricare la ricevuta');
      return;
    }

    const movementKey = this.getMovementUiKey(movement, index);

    const assetCode = this.assetId().trim();
    if (!assetCode) {
      this.popupMessageService.error('Codice asset non valido');
      return;
    }

    this.downloadingMovementReceiptId.set(movementKey);
    this.assetService.getMovementReceipt(assetCode, movementId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: blob => {
          if (!blob || blob.size === 0) {
            this.popupMessageService.error('Ricevuta non disponibile per questo movimento');
            this.downloadingMovementReceiptId.set(null);
            return;
          }

          const objectUrl = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = objectUrl;
          link.download = `ricevuta-movimento-${assetCode}-${movementId}.pdf`;
          link.click();
          URL.revokeObjectURL(objectUrl);

          this.popupMessageService.success('Ricevuta scaricata con successo');
          this.downloadingMovementReceiptId.set(null);
        },
        error: err => {
          console.error('Errore download ricevuta movimento:', err);
          const message = err?.status === 404
            ? 'Ricevuta non presente per questo movimento'
            : 'Impossibile scaricare la ricevuta di questo movimento';
          this.popupMessageService.error(message);
          this.downloadingMovementReceiptId.set(null);
        }
      });
  }

  // --- Helper per classi CSS sullo stato
  getStatusClass(): string {
    const status = this.asset()?.status;
    switch (status) {
      case 'Assigned': return 'status-assigned';
      case 'Available': return 'status-available';
      case 'UnderMaintenance': return 'status-under-maintenance';
      case 'Dismissed': return 'status-dismissed';
      case 'Unavailable': return 'status-unavailable';
      default: return '';
    }
  }
}
