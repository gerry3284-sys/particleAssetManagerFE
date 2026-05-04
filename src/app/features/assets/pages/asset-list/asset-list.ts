// asset-list.component.ts
import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination';
import { FiltersComponent } from '../../../../shared/components/filters/filters'; // ← AGGIUNGI
import { FilterValues } from '../../../../shared/models/filter-config.interface'; // ← AGGIUNGI
import { AssetService } from '../../../../shared/services/asset.service'; // ← AGGIUNGI
import { Asset, UnderMaintenanceAsset } from '../../../../shared/models/asset.interface';
import { ButtonComponent } from '../../../../shared/components/button/button';


@Component({
  selector: 'app-asset-list',
  standalone: true,
  imports: [
  CommonModule,
  FormsModule,
  PaginationComponent,
  FiltersComponent,
  ButtonComponent
], 
  templateUrl: './asset-list.html',
  styleUrl: './asset-list.css'
})
export class AssetListComponent implements OnInit {
    maintenanceOnly = signal(false);

    pageTitle = computed(() => this.maintenanceOnly() ? 'Asset in manutenzione' : 'Gestione asset');
    pageSubtitle = computed(() =>
      this.maintenanceOnly()
        ? 'Visualizza tutti gli asset attualmente in manutenzione.'
        : 'Visualizza e gestisci tutti gli asset aziendali.'
    );
    showCreateButton = computed(() => !this.maintenanceOnly());
  
  
  

  // Filtri correnti (signal)
  currentFilters = signal<FilterValues>({});

  // Assets (signal)
 allAssets = signal<Asset[]>([]);
 maintenanceAssets = signal<UnderMaintenanceAsset[]>([]);
 loading = signal(true);
 error = signal<string | null>(null); // segnala eventuali errori

  // Assets filtrati in base ai filtri correnti
  filteredAssets = computed(() => {
  if (this.maintenanceOnly()) {
    return [] as Asset[];
  }

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
    const normalizedFilterStatus = this.normalizeStatus(filters.status);
    if (normalizedFilterStatus) {
      assets = assets.filter(a => a.status === normalizedFilterStatus);
    }
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

  filteredMaintenanceAssets = computed(() => {
    if (!this.maintenanceOnly()) {
      return [] as UnderMaintenanceAsset[];
    }

    return this.maintenanceAssets();
  });


  // Paginazione
  currentPage = signal(1);
  itemsPerPage = signal(8);

  //calcolo pagine da mostrare in base a assets totali 
  totalPages = computed(() => {
    const totalItems = this.maintenanceOnly()
      ? this.filteredMaintenanceAssets().length
      : this.filteredAssets().length;
    return Math.ceil(totalItems / this.itemsPerPage());
  });

  //restituisce solo  assets da di quella pagina  corrente
  paginatedAssets = computed(() => {
    if (this.maintenanceOnly()) {
      return [] as Asset[];
    }

    const start = (this.currentPage() - 1) * this.itemsPerPage(); // indice iniziale della pagina
    const end = start + this.itemsPerPage(); // indice finale (escluso)
    return this.filteredAssets().slice(start, end);
  });

  paginatedMaintenanceAssets = computed(() => {
    if (!this.maintenanceOnly()) {
      return [] as UnderMaintenanceAsset[];
    }

    const start = (this.currentPage() - 1) * this.itemsPerPage();
    const end = start + this.itemsPerPage();
    return this.filteredMaintenanceAssets().slice(start, end);
  });

  //scritta che mosta range di assets mostrati e totale asset 
  displayRange = computed(() => {
    const totalItems = this.maintenanceOnly()
      ? this.filteredMaintenanceAssets().length
      : this.filteredAssets().length;

    if (!totalItems) {
      return 'Mostrando 0-0 di 0';
    }

    const start = (this.currentPage() - 1) * this.itemsPerPage() + 1;
    const end = Math.min(this.currentPage() * this.itemsPerPage(), totalItems);
    return `Mostrando ${start}-${end} di ${totalItems}`;
  });

  constructor(
    private router: Router,
    private readonly route: ActivatedRoute,
    private readonly assetService: AssetService
  ) {}

  ngOnInit(): void {
    this.route.data.subscribe(data => {
      this.maintenanceOnly.set(data['maintenanceOnly'] === true);
      this.currentPage.set(1);
      this.loadAssets();
    });
  }

  private loadAssets(): void {
    this.loading.set(true);
    this.error.set(null);
    this.currentPage.set(1);

    if (this.maintenanceOnly()) {
      this.allAssets.set([]);
      this.assetService.getUnderMaintenanceAssets().subscribe({
        next: assets => {
          this.maintenanceAssets.set(assets);
          this.loading.set(false);
        },
        error: err => {
          console.error(err);
          this.error.set('Errore nel caricamento degli asset in manutenzione');
          this.loading.set(false);
        }
      });
      return;
    }

    this.maintenanceAssets.set([]);
    this.assetService.getAssets().subscribe({
      next: assets => {
        this.allAssets.set(assets);
        this.loading.set(false);
      },
      error: err => {
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

  goToAssetDetail(assetCode: string): void {
  this.router.navigate(['/assets', assetCode]);
}

  createNewAsset(): void {
  this.router.navigate(['/assets/new']);
}

  goToPage(page: number): void {
    this.currentPage.set(page);
    console.log('Pagina:', page);
    
    const tableCard = document.querySelector('.table-card');
    if (tableCard) {
      tableCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  private normalizeStatus(value: string): Asset['status'] | null {
    const normalized = (value ?? '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');

    if (!normalized) {
      return null;
    }

    if (normalized.startsWith('AS') || normalized.includes('ASSIGN') || normalized.includes('ASSEGN')) {
      return 'Assigned';
    }

    if (normalized.startsWith('AV') || normalized.includes('AVAIL') || normalized.includes('DISPONIBIL')) {
      return 'Available';
    }

    if (normalized.startsWith('DI') || normalized.includes('DISMISS') || normalized.includes('DISMESS')) {
      return 'Dismissed';
    }

    if (
      normalized.startsWith('UM')
      || normalized.startsWith('MA')
      || normalized.includes('UNDERMAINT')
      || normalized.includes('MAINTEN')
      || normalized.includes('MANUTEN')
    ) {
      return 'UnderMaintenance';
    }

    if (normalized.includes('UNAVAIL') || normalized.includes('NONDISPONIB')) {
      return 'Unavailable';
    }

    return null;
  }
  
}