import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { FilterService } from '../../../../shared/services/filter.service';
import { AssetService } from '../../../../shared/services/asset.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';
import { DropdownComponent } from '../../../../shared/components/dropdown/dropdown';
import { ButtonComponent } from '../../../../shared/components/button/button';

@Component({
  selector: 'app-asset-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DropdownComponent, ButtonComponent],
  templateUrl: './asset-create.html',
  styleUrl: './asset-create.css'
})
export class AssetCreateComponent {
  private readonly router = inject(Router);
  private readonly filterService = inject(FilterService);
  private readonly assetService = inject(AssetService);
  
  // Reactive form for asset creation.
  assetForm = new FormGroup({
    brand: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    model: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    assetType: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    serialNumber: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    businessUnit: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    notes: new FormControl('', { nonNullable: true }),
    ramGb: new FormControl('', { nonNullable: true }),
    hardDiskGb: new FormControl('', { nonNullable: true })
  });

  formValue = toSignal(this.assetForm.valueChanges, {
    initialValue: this.assetForm.getRawValue()
  });

  // Errori di caricamento opzioni
  assetTypesError = signal<string | null>(null);
  businessUnitsError = signal<string | null>(null);

  // Dati da API come signals (niente subscribe manuale)
  assetTypes = toSignal(
    this.filterService.getAssetTypes().pipe(
      catchError(err => {
        console.error('Errore caricamento tipologie asset:', err);
        this.assetTypesError.set('Errore nel caricamento tipologie');
        return of([]);
      })
    ),
    { initialValue: [] }
  );

  businessUnits = toSignal(
    this.filterService.getBusinessUnits().pipe(
      catchError(err => {
        console.error('Errore caricamento Business Unit:', err);
        this.businessUnitsError.set('Errore nel caricamento Business Unit');
        return of([]);
      })
    ),
    { initialValue: [] }
  );

  assetStatusTypes = toSignal(
    this.filterService.getAssetStatusTypes().pipe(
      catchError(err => {
        console.error('Errore caricamento stati asset:', err);
        return of([]);
      })
    ),
    { initialValue: [] }
  );

  // Opzioni per le select derivate dai dati
  assetTypeOptions = computed(() => [
    { value: '', label: 'Seleziona una tipologia' },
    ...this.assetTypes().map(type => ({
      value: type.code ?? type.name,
      label: type.name
    }))
  ]);

  businessUnitOptions = computed(() => [
    { value: '', label: 'Seleziona una Business Unit' },
    ...this.businessUnits().map(unit => ({
      value: unit.code ?? unit.name,
      label: unit.name
    }))
  ]);

  selectedAssetType = computed(() =>
    this.assetTypes().find(type => (type.code ?? type.name) === this.formValue().assetType) ?? null
  );

  selectedBusinessUnit = computed(() =>
    this.businessUnits().find(unit => (unit.code ?? unit.name) === this.formValue().businessUnit) ?? null
  );

  defaultStatusLabel = computed(() => {
    return this.assetStatusTypes().find(status => status.name === 'Available')?.name ?? 'Available';
  });

  // Stato di submit
  isSubmitting = signal(false);
  showConfirm = signal(false);

  constructor() {
    this.assetForm.controls.assetType.valueChanges.subscribe(() => {
      this.assetForm.controls.ramGb.setValue('');
      this.assetForm.controls.hardDiskGb.setValue('');
      this.updateConditionalValidators();
    });
    this.updateConditionalValidators();
  }

  // Torna alla lista
  goBack(): void {
    this.router.navigate(['/assets']);
  }

  // Annulla e torna indietro
  cancel(): void {
    if (confirm('Sei sicuro di voler annullare? Le modifiche non salvate andranno perse.')) {
      this.goBack();
    }
  }

  private updateConditionalValidators(): void {
    const requiresRam = !!this.selectedAssetType()?.ram;
    const requiresHardDisk = !!this.selectedAssetType()?.hardDisk;

    if (requiresRam) {
      this.assetForm.controls.ramGb.setValidators([
        Validators.required,
        Validators.min(2),
        Validators.pattern('^[0-9]+$')
      ]);
    } else {
      this.assetForm.controls.ramGb.clearValidators();
    }

    if (requiresHardDisk) {
      this.assetForm.controls.hardDiskGb.setValidators([
        Validators.required,
        Validators.pattern('^[0-9]+$')
      ]);
    } else {
      this.assetForm.controls.hardDiskGb.clearValidators();
    }

    this.assetForm.controls.ramGb.updateValueAndValidity({ emitEvent: false });
    this.assetForm.controls.hardDiskGb.updateValueAndValidity({ emitEvent: false });
  }

  openConfirm(): void {
    if (!this.assetForm.valid) {
      alert('Compila tutti i campi obbligatori');
      return;
    }

    this.showConfirm.set(true);
  }

  closeConfirm(): void {
    this.showConfirm.set(false);
  }

  confirmCreate(): void {
    this.showConfirm.set(false);
    this.createAsset();
  }

  // Crea l'asset
  createAsset(): void {
    if (!this.assetForm.valid) {
      alert('Compila tutti i campi obbligatori');
      return;
    }

    this.isSubmitting.set(true);

    const form = this.assetForm.getRawValue();
    const requiresRam = !!this.selectedAssetType()?.ram;
    const requiresHardDisk = !!this.selectedAssetType()?.hardDisk;
    const ramValue = (form.ramGb ?? '').toString().trim();
    const hardDiskValue = (form.hardDiskGb ?? '').toString().trim();
    const parsedRam = ramValue === '' ? 0 : Number(ramValue);
    const safeRam = Number.isFinite(parsedRam) ? parsedRam : 0;

    const payload = {
      brand: form.brand,
      model: form.model,
      serialNumber: form.serialNumber,
      note: form.notes ?? '',
      hardDisk: requiresHardDisk ? hardDiskValue : '',
      businessUnitCode: form.businessUnit,
      assetTypeCode: form.assetType,
      ram: requiresRam ? safeRam : 0
    };
    this.assetService.createAsset(payload).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        alert('Asset creato con successo!');
        this.goBack();
      },
      error: err => {
        console.error('Errore creazione asset:', err);
        this.isSubmitting.set(false);
        alert('Errore durante la creazione dell\'asset');
      }
    });
  }

}