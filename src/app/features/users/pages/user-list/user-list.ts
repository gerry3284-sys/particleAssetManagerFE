import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { User } from '../../../../models/user.model';
import { RouterLink, RouterLinkActive } from "@angular/router";
import { PaginationComponent } from "../../../../shared/components/pagination/pagination";
import { ApiService } from '../../../../services/api';
import { FormsModule } from "@angular/forms";
import { forkJoin } from 'rxjs';
import { BusinessUnit } from '../../../../shared/services/business-unit.service';

@Component({
  selector: 'app-user-list',
  standalone: true,
  templateUrl: './user-list.html',
  styleUrl: './user-list.css',
  imports: [RouterLink, PaginationComponent, RouterLinkActive, FormsModule]
})
export class UserList{
  users = signal<User[]>([]);
  usersFiltered = signal<User[]>([]);
  businessUnits = signal<BusinessUnit[]>([]);
  loading = signal(true);
  destroyRef = inject(DestroyRef);
  initialName = '';
  filter = '';

  // costruttore con tutti i get
  constructor(private apiService: ApiService) {
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
        console.error('API error user', err);
        this.users.set([]);
        this.businessUnits.set([]);

        this.usersFiltered.set(this.users());
        this.loading.set(false);
      }
    });
    this.destroyRef.onDestroy(() => subscription.unsubscribe());
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

    if (this.filter !== '') {
      filtered = filtered.filter(user => user.businessUnit.name === this.filter);
    }

    this.usersFiltered.set(filtered); 
  }
}
