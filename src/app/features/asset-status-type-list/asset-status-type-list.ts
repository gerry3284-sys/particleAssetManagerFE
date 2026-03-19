import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from '../../shared/components/button/button';
import {
  EditAssetStatusTypeForm,
  EditAssetStatusTypeModalComponent
} from '../assets/components/edit-asset-status-type-modal/edit-asset-status-type-modal';
import { FilterService } from '../../shared/services/filter.service';
import { AssetStatusType } from '../../shared/models/filter-config.interface';
import { PopupMessageService } from '../../shared/services/popup-message.service';

@Component({
  selector: 'app-asset-status-type-list',
  standalone: true,
  imports: [CommonModule, ButtonComponent, EditAssetStatusTypeModalComponent],
  templateUrl: './asset-status-type-list.html',
  styleUrl: './asset-status-type-list.css'
})
export class AssetStatusTypeListComponent implements OnInit {
  statusTypes = signal<AssetStatusType[]>([]);
  loading = signal(true);
  isSaving = signal(false);
  error = signal<string | null>(null);

  showEditModal = signal(false);
  selectedStatusType = signal<AssetStatusType | null>(null);
  showCreateModal = signal(false);
  createName = signal('');
  createNameError = signal(false);

  constructor(
    private readonly filterService: FilterService,
    private readonly popupMessageService: PopupMessageService
  ) {}

  ngOnInit(): void {
    this.loadAssetStatusTypes();
  }

  loadAssetStatusTypes(): void {
    this.loading.set(true);
    this.error.set(null);

    this.filterService.getAssetStatusTypes(true).subscribe({
      next: statusTypes => {
        this.statusTypes.set(statusTypes ?? []);
        this.loading.set(false);
      },
      error: err => {
        console.error('Errore caricamento AssetStatusType:', err);
        this.error.set('Errore nel caricamento degli AssetStatusType');
        this.statusTypes.set([]);
        this.loading.set(false);
      }
    });
  }

  openEditModal(statusType: AssetStatusType): void {
    this.selectedStatusType.set(statusType);
    this.showEditModal.set(true);
  }

  openCreateModal(): void {
    this.createName.set('');
    this.createNameError.set(false);
    this.showCreateModal.set(true);
  }

  closeCreateModal(): void {
    this.showCreateModal.set(false);
    this.createName.set('');
    this.createNameError.set(false);
  }

  closeEditModal(): void {
    this.showEditModal.set(false);
    this.selectedStatusType.set(null);
  }

  onConfirmEdit(formData: EditAssetStatusTypeForm): void {
    const current = this.selectedStatusType();
    if (!current?.code) {
      this.popupMessageService.error('Codice AssetStatusType non disponibile');
      return;
    }

    this.isSaving.set(true);

    this.filterService.updateAssetStatusType(current.code, { name: formData.name }).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.closeEditModal();
        this.popupMessageService.success('AssetStatusType aggiornato con successo');
        this.loadAssetStatusTypes();
      },
      error: err => {
        console.error('Errore aggiornamento AssetStatusType:', err);
        this.isSaving.set(false);
        this.popupMessageService.error('Errore durante l\'aggiornamento di AssetStatusType');
      }
    });
  }

  onCreateStatusType(): void {
    const name = this.createName().trim();
    this.createNameError.set(!name);
    if (!name) {
      return;
    }

    this.isSaving.set(true);

    this.filterService.createAssetStatusType({ name }).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.closeCreateModal();
        this.popupMessageService.success('AssetStatusType creato con successo');
        this.loadAssetStatusTypes();
      },
      error: err => {
        console.error('Errore creazione AssetStatusType:', err);
        this.isSaving.set(false);
        this.popupMessageService.error('Errore durante la creazione di AssetStatusType');
      }
    });
  }
}
