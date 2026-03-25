import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from '../../shared/components/button/button';
import { FiltersComponent } from '../../shared/components/filters/filters';
import {
  EditAssetStatusTypeForm,
  EditAssetStatusTypeModalComponent
} from '../assets/components/edit-asset-status-type-modal/edit-asset-status-type-modal';
import { FilterService } from '../../shared/services/filter.service';
import { AssetStatusType, FilterValues } from '../../shared/models/filter-config.interface';
import { PopupMessageService } from '../../shared/services/popup-message.service';

@Component({
  selector: 'app-asset-status-type-list',
  standalone: true,
  imports: [CommonModule, ButtonComponent, EditAssetStatusTypeModalComponent, FiltersComponent],
  templateUrl: './asset-status-type-list.html',
  styleUrl: './asset-status-type-list.css'
})
export class AssetStatusTypeListComponent implements OnInit {
  statusTypes = signal<AssetStatusType[]>([]);
  currentFilters = signal<FilterValues>({});
  loading = signal(true);
  isSaving = signal(false);
  error = signal<string | null>(null);

  showEditModal = signal(false);
  selectedStatusType = signal<AssetStatusType | null>(null);
  showCreateModal = signal(false);
  createName = signal('');
  createNameError = signal(false);

  filteredStatusTypes = computed(() => {
    const query = this.normalizeName(this.currentFilters().assignedUser ?? '');
    if (!query) {
      return this.statusTypes();
    }

    return this.statusTypes().filter(statusType =>
      this.normalizeName(statusType.name).includes(query)
    );
  });

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

  onFiltersChange(filters: FilterValues): void {
    this.currentFilters.set(filters);
  }

  onConfirmEdit(formData: EditAssetStatusTypeForm): void {
    const current = this.selectedStatusType();
    if (!current?.code) {
      this.popupMessageService.error('Codice AssetStatusType non disponibile');
      return;
    }

    const nextName = formData.name.trim();
    if (this.isNameDuplicated(nextName, current.id)) {
      this.popupMessageService.error('Il nome inserito e gia presente in lista. Scegli un nome diverso.');
      return;
    }

    this.isSaving.set(true);

    this.filterService.updateAssetStatusType(current.code, { name: nextName }).subscribe({
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
    this.createNameError.set(name.length < 2);
    if (name.length < 2) {
      return;
    }

    if (this.isNameDuplicated(name)) {
      this.popupMessageService.error('Il nome inserito e gia presente in lista. Scegli un nome diverso.');
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

  private isNameDuplicated(name: string, excludedId?: number): boolean {
    const normalizedName = this.normalizeName(name);

    return this.statusTypes().some(statusType => {
      if (excludedId !== undefined && statusType.id === excludedId) {
        return false;
      }

      return this.normalizeName(statusType.name) === normalizedName;
    });
  }

  private normalizeName(value: string): string {
    return value.trim().toLocaleLowerCase();
  }
}
