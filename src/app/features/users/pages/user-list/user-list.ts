import { Component, computed, signal } from '@angular/core';
import { BusinessType, User } from '../../../../models/user.model';
import { RouterLink, RouterLinkActive } from "@angular/router";
import { PaginationComponent } from "../../../../shared/components/pagination/pagination";
import { ApiService } from '../../../../services/api';
import { FormsModule } from "@angular/forms";



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
  businessTypes = signal<BusinessType[]>([]);
  filter = '';

  constructor(private apiService: ApiService) {
    this.apiService.getUsers().subscribe({
      next: data => {
        this.users.set(data ?? ['placeholder']);
        this.usersFiltered.set(this.users());
      },
      error: err => {
        console.error('API error user', err);
        this.users.set([]);
        this.usersFiltered.set(this.users());
      }
    });
    this.apiService.getBusinessUnitType().subscribe({
      next: data => this.businessTypes.set(data ?? ['placeholder']),
      error: err => {
        console.error('API error businessUnit', err);
        this.businessTypes.set([]);
      }
    })
  }

  searchTerm = signal('');

  // Filtered items using computed signal
  filteredItems = computed(() => {
    const term = this.searchTerm().toLowerCase();
    if (!term) {
      return this.users();
    }
    return this.users().filter(user => 
      user.name.toLowerCase().includes(term)
    );
  });

  // Update search term
  onSearchChange(value: string) {
    this.searchTerm.set(value);
  }

  currentPage = signal(1);
  
  itemsPerPage = signal(5);

  // ricalcolo e aggiorno  automaticamente dopo ogni cambiamento
  totalPages = computed(() => {
    return Math.ceil(this.users().length / this.itemsPerPage());
  });
  // si aggiorna automaticamente quando cambi pagina o aggiungi/rimuovi users
  paginatedUser = computed(() => {
    const start = (this.currentPage() - 1) * this.itemsPerPage();
    const end = start + this.itemsPerPage();
    return this.users().slice(start, end);
  });
  //creazione stringa display range.
  displayRange = computed(() => {
    const start = (this.currentPage() - 1) * this.itemsPerPage() + 1;
    const end = Math.min(this.currentPage() * this.itemsPerPage(), this.users().length);
    return `Mostrando ${start}-${end} di ${this.users().length}`;
  });

  goToPage(page: number): void {
    this.currentPage.set(page); 
    console.log('Pagina:', page);
  }

  onFilter(){
    console.log(this.filter);
    let filtered: User[] = [];

    if(this.filter === ''){
      return this.usersFiltered.set(this.users());
    }
    else{
      this.users().forEach(user => {
        if(user.businessUnit.name === this.filter){
          filtered = [...filtered, user];
        }
      })
      return this.usersFiltered.set(filtered);
    }
  }
}
