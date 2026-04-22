import { Component, EventEmitter, Output, OnInit, computed, input, signal, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl } from '@angular/forms';
import { FilterService } from '../../services/filter.service';
import { AssetType, BusinessUnit, AssetStatusType } from '../../models/filter-config.interface';
import { merge } from 'rxjs';
import { debounceTime, map } from 'rxjs/operators';
import { DropdownComponent } from '../dropdown/dropdown';
import { DropdownOption } from '../../models/dropdown-option.interface';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';


@Component({
  selector: 'app-filters',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DropdownComponent], // serve per ngFor, ngIf e Reactive Forms
  templateUrl: './filters.html',
  styleUrl: './filters.css',
})
export class FiltersComponent implements OnInit {
    mode = input<'full' | 'name-only'>('full');
  showStatus = input(true);
    searchLabel = input('Nome Assegnatario');
    searchPlaceholder = input('Cerca per nome...');

    isNameOnlyMode = computed(() => this.mode() === 'name-only');

  // DestroyRef + takeUntilDestroyed: chiude automaticamente i subscribe
  // quando il componente viene distrutto (best practice Angular 21).
  private readonly destroyRef: DestroyRef = inject(DestroyRef);

  // output  emette i filtri al padre quando cambiano
  @Output() filtersChange = new EventEmitter<{
    assetType: string;
    businessUnit: string;
    status: string;
    assignedUser: string;
  }>();

  //  Signals per i dati delle select
  assetTypes = signal<AssetType[]>([]);
  businessUnits = signal<BusinessUnit[]>([]);
  assetStatusTypes = signal<AssetStatusType[]>([]);

  // Convert API data into dropdown options for the reusable component.
  assetTypeOptions = computed<DropdownOption[]>(() => [
    { value: '', label: 'Tutte le tipologie' },
    ...this.assetTypes().map(type => ({
      value: type.name,
      label: type.name
    }))
  ]);

  businessUnitOptions = computed<DropdownOption[]>(() => [
    { value: '', label: 'Tutte le BU' },
    ...this.businessUnits().map(unit => ({
      value: unit.name,
      label: unit.name
    }))
  ]);

  statusOptions = computed<DropdownOption[]>(() => [
    { value: '', label: 'Tutti gli stati' },
    ...this.assetStatusTypes().map(status => ({
      value: status.name,
      label: status.name
    }))
  ]);

  // FormGroup per tutti i filtri
  filtersForm = new FormGroup<{
    assetType: FormControl<string>;
    businessUnit: FormControl<string>;
    status: FormControl<string>;
    assignedUser: FormControl<string>;
  }>({
    assetType: new FormControl<string>('', { nonNullable: true }),      // dropdown tipologia asset
    businessUnit: new FormControl<string>('', { nonNullable: true }),  // dropdown business unit
    status: new FormControl<string>('', { nonNullable: true }),        // dropdown stato asset
    assignedUser: new FormControl<string>('', { nonNullable: true }),  // input nome assegnatario
  });

  constructor(private filterService: FilterService) {}

  ngOnInit(): void {
    if (!this.isNameOnlyMode()) {
    // Popoliamo i dropdown tramite API.
    // Questi stream HTTP in genere completano da soli, ma takeUntilDestroyed
    // rende il codice robusto anche in scenari futuri (refactor/reuse/test).
    this.filterService.getAssetTypes()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(types => this.assetTypes.set(types));

    this.filterService.getBusinessUnits()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(bu => this.businessUnits.set(bu));

    if (this.showStatus()) {
      this.filterService.getAssetStatusTypes()
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(status => this.assetStatusTypes.set(status));
    }
    }

    // valueChanges è un flusso lungo: NON si completa da solo.
    // Senza teardown il subscribe può restare attivo oltre il lifecycle atteso.
    // Qui lo chiudiamo in automatico con takeUntilDestroyed.

    // Emissione filtri: immediata per select, debounced per input nome.
    const debounced$ = this.filtersForm.controls.assignedUser.valueChanges.pipe(
      debounceTime(500) // aspetta 500ms dall’ultimo carattere digitato
    );

    const immediateStreams = this.isNameOnlyMode()
      ? []
      : [
          this.filtersForm.controls.assetType.valueChanges,
          this.filtersForm.controls.businessUnit.valueChanges,
          ...(this.showStatus() ? [this.filtersForm.controls.status.valueChanges] : [])
        ];

    merge(debounced$, ...immediateStreams)
      .pipe(
        map(() => this.filtersForm.getRawValue()),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(values => {
        this.filtersChange.emit(values);
      });
  }
}
