import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination';
import { ButtonComponent } from '../../../../shared/components/button/button';
import { AssetService } from '../../../../shared/services/asset.service';
import { UnderMaintenanceAsset } from '../../../../shared/models/asset.interface';
import { FiltersComponent } from '../../../../shared/components/filters/filters';
import { FilterValues } from '../../../../shared/models/filter-config.interface';

@Component({
  selector: 'app-asset-maintenance-list',
  standalone: true,
  imports: [CommonModule, PaginationComponent, ButtonComponent, FiltersComponent],
  templateUrl: './asset-maintenance-list.html',
  styleUrl: './asset-maintenance-list.css'
})
export class AssetMaintenanceListComponent implements OnInit {
  maintenanceAssets = signal<UnderMaintenanceAsset[]>([]);
  currentFilters = signal<FilterValues>({});
  loading = signal(true);
  error = signal<string | null>(null);

  currentPage = signal(1);
  itemsPerPage = signal(8);

  totalPages = computed(() => {
    return Math.ceil(this.filteredMaintenanceAssets().length / this.itemsPerPage());
  });

  filteredMaintenanceAssets = computed(() => {
    const filters = this.currentFilters();
    let assets = this.maintenanceAssets();

    if (filters.assetType) {
      assets = assets.filter(asset => asset.assetType === filters.assetType);
    }

    if (filters.businessUnit) {
      assets = assets.filter(asset => asset.businessUnit === filters.businessUnit);
    }

    if (filters.assignedUser) {
      const search = filters.assignedUser.toLowerCase();
      assets = assets.filter(asset =>
        asset.assetCode.toLowerCase().includes(search)
        || asset.brand.toLowerCase().includes(search)
        || asset.model.toLowerCase().includes(search)
        || asset.serialNumber.toLowerCase().includes(search)
      );
    }

    return assets;
  });

  paginatedMaintenanceAssets = computed(() => {
    const start = (this.currentPage() - 1) * this.itemsPerPage();
    const end = start + this.itemsPerPage();
    return this.filteredMaintenanceAssets().slice(start, end);
  });

  displayRange = computed(() => {
    const totalItems = this.filteredMaintenanceAssets().length;
    if (!totalItems) {
      return 'Mostrando 0-0 di 0';
    }

    const start = (this.currentPage() - 1) * this.itemsPerPage() + 1;
    const end = Math.min(this.currentPage() * this.itemsPerPage(), totalItems);
    return `Mostrando ${start}-${end} di ${totalItems}`;
  });

  constructor(
    private readonly router: Router,
    private readonly assetService: AssetService
  ) {}

  ngOnInit(): void {
    this.loadMaintenanceAssets();
  }

  private loadMaintenanceAssets(): void {
    this.loading.set(true);
    this.error.set(null);
    this.currentPage.set(1);

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
  }

  goToAssetDetail(assetCode: string): void {
    this.router.navigate(['/assets', assetCode]);
  }

  goToPage(page: number): void {
    this.currentPage.set(page);

    const tableCard = document.querySelector('.table-card');
    if (tableCard) {
      tableCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  goToAssetsList(): void {
    this.router.navigate(['/assets']);
  }

  onFiltersChange(filters: FilterValues): void {
    this.currentFilters.set(filters);
    this.currentPage.set(1);
  }
}
