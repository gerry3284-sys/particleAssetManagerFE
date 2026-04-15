import { Component, computed, DestroyRef, EventEmitter, inject, Output, signal } from '@angular/core';
import { User } from '../../../../models/user.model';
import { PaginationComponent } from "../../../../shared/components/pagination/pagination";
import { ApiService } from '../../../../services/api';
import { FormControl, FormGroup, FormsModule } from "@angular/forms";
import { debounceTime, forkJoin, map, merge } from 'rxjs';
import { BusinessUnit } from '../../../../shared/services/business-unit.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FilterValues } from '../../../../shared/models/filter-config.interface';
import { PopupMessageService } from '../../../../shared/services/popup-message.service';

@Component({
  selector: 'app-user-list',
  standalone: true,
  templateUrl: './user-list.html',
  styleUrl: './user-list.css',
  imports: [PaginationComponent, FormsModule]
})
export class UserList{
  currentFilters = signal<FilterValues>({});
  @Output() filtersChange = new EventEmitter<{
    businessUnit: string;
    user: string;
  }>();
  filtersForm = new FormGroup<{
    businessUnit: FormControl<string>;
    user: FormControl<string>;
  }>({
    businessUnit: new FormControl<string>('', { nonNullable: true }),
    user: new FormControl<string>('', { nonNullable: true }),
  });

  users = signal<User[]>([]);
  usersFiltered = signal<User[]>([]);
  businessUnits = signal<BusinessUnit[]>([]);
  loading = signal(true);
  destroyRef = inject(DestroyRef);
  initialName = '';
  filterBU = '';

  // costruttore con tutti i get
  constructor(private apiService: ApiService, private readonly popupMessageService: PopupMessageService) {
    const subscription = forkJoin({
      users: this.apiService.getUsers(),
      businessUnits: this.apiService.getBusinessUnits()
    }).subscribe({
      next:({users, businessUnits}) =>{
        this.users.set(users ?? ['placeholder']);
        this.businessUnits.set(businessUnits ?? ['placeholder'])

        this.usersFiltered.set(this.users());
        this.loading.set(false);
      },
      error: err => {
        this.popupMessageService.error('Errore durante il caricamento degli utenti');
        console.error('API error user', err);
        this.users.set([]);
        this.businessUnits.set([]);

        this.usersFiltered.set(this.users());
        this.loading.set(false);
      }
    });
    this.destroyRef.onDestroy(() => subscription.unsubscribe());

    const immediate$ = merge(
      this.filtersForm.controls.businessUnit.valueChanges,
    );
    const debounced$ = this.filtersForm.controls.user.valueChanges.pipe(
      debounceTime(300)
    );
    merge(immediate$, debounced$).pipe(
      map(() => this.filtersForm.getRawValue()),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(values => {
      this.filtersChange.emit(values);
    });
  }
  onFiltersChange(filters: FilterValues): void {
      this.currentFilters.set(filters);
      
      // Reset alla prima pagina quando i filtri cambiano
      this.currentPage.set(1);
    }
  currentPage = signal(1);
  itemsPerPage = signal(5);

  // ricalcolo e aggiorno automaticamente dopo ogni cambiamento
  totalPages = computed(() => {
    return Math.ceil(this.usersFiltered().length / this.itemsPerPage());
  });
  // si aggiorna automaticamente quando cambi pagina o aggiungi/rimuovi users
  paginatedUser = computed(() => {
    const start = (this.currentPage() - 1) * this.itemsPerPage();
    const end = start + this.itemsPerPage();
    return this.usersFiltered().slice(start, end);
  });
  //creazione stringa display range.
  displayRange = computed(() => {
    const start = (this.currentPage() - 1) * this.itemsPerPage() + 1;
    const end = Math.min(this.currentPage() * this.itemsPerPage(), this.usersFiltered().length);
    return `Mostrando ${start}-${end} di ${this.usersFiltered().length}`;
  });

  goToPage(page: number): void {
    this.currentPage.set(page);
  }

  // funzione che filtra la lista di user
  onFilter() {
    let filtered = this.users();

    if (this.initialName !== '') {
      const search = this.initialName.toLowerCase();
      filtered = filtered.filter(user =>
        user.name?.toLowerCase().includes(search) || user.surname.toLowerCase().includes(search)
      );
    }

    if (this.filterBU !== '') {
      filtered = filtered.filter(user => {
        if(user.businessUnit === null) {
          return false;
        }
        return user.businessUnit.name === this.filterBU
      });
    }

    this.usersFiltered.set(filtered);
  }
}
