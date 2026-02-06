import { Component, EventEmitter, Output, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl } from '@angular/forms';
import { FilterService } from '../../services/filter.service';
import { User, AssetType, BusinessUnit, AssetStatusType } from '../../models/filter-config.interface';
import { merge } from 'rxjs';
import { debounceTime, map } from 'rxjs/operators';


@Component({
  selector: 'app-filters',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule], // serve per ngFor, ngIf e Reactive Forms
  templateUrl: './filters.html',
  styleUrl: './filters.css',
})
export class FiltersComponent implements OnInit {

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
  users = signal<User[]>([]);

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
    // 4️⃣ Popoliamo i dropdown tramite API
    this.filterService.getAssetTypes().subscribe(types => this.assetTypes.set(types));
    this.filterService.getBusinessUnits().subscribe(bu => this.businessUnits.set(bu));
    this.filterService.getAssetStatusTypes().subscribe(status => this.assetStatusTypes.set(status));
    this.filterService.getUsers().subscribe(users => this.users.set(users));

    // 5️⃣ Emissione filtri: immediata per select, debounced per input nome
    const immediate$ = merge(
      this.filtersForm.controls.assetType.valueChanges,
      this.filtersForm.controls.businessUnit.valueChanges,
      this.filtersForm.controls.status.valueChanges
    );

    const debounced$ = this.filtersForm.controls.assignedUser.valueChanges.pipe(
      debounceTime(500) // aspetta 500ms dall’ultimo carattere digitato
    );

    merge(immediate$, debounced$)
      .pipe(map(() => this.filtersForm.getRawValue()))
      .subscribe(values => {
        this.filtersChange.emit(values);
      });
  }
}
