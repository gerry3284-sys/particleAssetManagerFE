// asset-list.component.ts
import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination';
import { FiltersComponent } from '../../../../shared/components/filters/filters'; // ← AGGIUNGI
import { FilterValues } from '../../../../shared/models/filter-config.interface'; // ← AGGIUNGI
import { HttpClientModule } from '@angular/common/http';
import { AssetService } from '../../../../shared/services/asset.service'; // ← AGGIUNGI
import { Asset } from '../../../../shared/models/asset.interface';


@Component({
  selector: 'app-asset-list',
  standalone: true,
  imports: [
  CommonModule,
  FormsModule,
  HttpClientModule,
  PaginationComponent,
  FiltersComponent
], 
  templateUrl: './asset-list.html',
  styleUrl: './asset-list.css'
})
export class AssetListComponent implements OnInit {
  
  
  

  // Filtri correnti (signal)
  currentFilters = signal<FilterValues>({});

  // Assets (signal)
 allAssets = signal<Asset[]>([]);
 loading = signal(true);
 error = signal<string | null>(null); // segnala eventuali errori

  // Assets filtrati in base ai filtri correnti
  filteredAssets = computed(() => {
  const filters = this.currentFilters();
  let assets = this.allAssets();

  // Filtra per Tipologia
  if (filters.assetType) {
    // contorllo se "a"(singolo asset dell'array assets) è ugualea filters.assetType , se è vero rimane (array filtrato) se è falso viene scartato
    assets = assets.filter(a => a.assetType === filters.assetType); 
  }

  // Filtra per Business Unit
  if (filters.businessUnit) {
    assets = assets.filter(a => a.businessUnit === filters.businessUnit);
  }

  // Filtra per Status
  if (filters.status) {
    assets = assets.filter(a => a.status === filters.status);
  }

  // Filtra per Nome assegnatario (ricerca parziale)
  if (filters.assignedUser) {
    const search = filters.assignedUser.toLowerCase();
    assets = assets.filter(a =>
      a.assignedUser?.toLowerCase().includes(search)
    );
  }

  return assets;
});


  // Paginazione
  currentPage = signal(1);
  itemsPerPage = signal(5);

  totalPages = computed(() => {
    return Math.ceil(this.filteredAssets().length / this.itemsPerPage());
  });

  paginatedAssets = computed(() => {
    const start = (this.currentPage() - 1) * this.itemsPerPage();
    const end = start + this.itemsPerPage();
    return this.filteredAssets().slice(start, end);
  });

  displayRange = computed(() => {
    const start = (this.currentPage() - 1) * this.itemsPerPage() + 1;
    const end = Math.min(this.currentPage() * this.itemsPerPage(), this.filteredAssets().length);
    return `Mostrando ${start}-${end} di ${this.filteredAssets().length}`;
  });

  constructor(
    private router: Router,
    private readonly assetService: AssetService
  ) {}

  ngOnInit(): void {
  this.loadAssets();
}
  private loadAssets(): void {
    this.loading.set(true);
    this.assetService.getAssets().subscribe({
      next: (assets) => {
        this.allAssets.set(assets);
        this.loading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.error.set('Errore nel caricamento degli asset');
        this.loading.set(false);
      }
    });
  }

 
  onFiltersChange(filters: FilterValues): void {
    console.log('Filtri applicati:', filters);
    this.currentFilters.set(filters);
    
    // Reset alla prima pagina quando i filtri cambiano
    this.currentPage.set(1);
  }

  goToAssetDetail(assetId: string): void {
  this.router.navigate(['/assets', assetId]); // ← RIMUOVI il return
}

  createNewAsset(): void {
  this.router.navigate(['/assets/new']);  // ← RIMUOVI il return
}

  goToPage(page: number): void {
    this.currentPage.set(page);
    console.log('Pagina:', page);
    
    const tableCard = document.querySelector('.table-card');
    if (tableCard) {
      tableCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
  
}