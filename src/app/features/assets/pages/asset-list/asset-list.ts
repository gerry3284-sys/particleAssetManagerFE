// asset-list.component.ts
import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination';
import { FiltersComponent } from '../../../../shared/components/filters/filters'; // ← AGGIUNGI
import { FilterField, FilterValues } from '../../../../shared/models/filter-config.interface'; // ← AGGIUNGI

interface Asset {
  id: string;
  status: 'assigned' | 'available' | 'dismissed';
  statusLabel: string;
  brand: string;
  model: string;
  serialNumber: string;
  assignedUser: string;
  businessUnit: string;
  assignmentDate: string;
}

@Component({
  selector: 'app-asset-list',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginationComponent, FiltersComponent], // ← AGGIUNGI FiltersComponent
  templateUrl: './asset-list.html',
  styleUrls: ['./asset-list.css']
})
export class AssetListComponent implements OnInit {
  
  
  filterFields: FilterField[] = [
    {
      key: 'typology',
      label: 'Tipologia Asset',
      type: 'select',
      options: [
        { value: '', label: 'Tutte le Tipologie' },
        { value: 'laptop', label: 'Laptop' },
        { value: 'phone', label: 'Smartphone' },
        { value: 'tablet', label: 'Tablet' },
        { value: 'sim', label: 'SIM' }
      ]
    },
    {
      key: 'businessUnit',
      label: 'Business Unit',
      type: 'select',
      options: [
        { value: '', label: 'Tutte le BU' },
        { value: 'Marketing', label: 'Marketing' },
        { value: 'Vendite', label: 'Vendite' },
        { value: 'IT', label: 'IT' },
        { value: 'HR', label: 'HR' }
      ]
    },
    {
      key: 'status',
      label: 'Stato Asset',
      type: 'select',
      options: [
        { value: '', label: 'Tutti gli Stati' },
        { value: 'assigned', label: 'Assegnato' },
        { value: 'available', label: 'Disponibile' },
        { value: 'dismissed', label: 'Dismesso' }
      ]
    },
    {
      key: 'searchName',
      label: 'Nome Assegnatario',
      type: 'search',
      placeholder: 'Cerca per nome...'
    }
  ];

  // Filtri correnti (signal)
  currentFilters = signal<FilterValues>({});

  // Assets (signal)
  allAssets = signal<Asset[]>([
    {
      id: '1',
      status: 'assigned',
      statusLabel: 'Assegnato',
      brand: 'Apple',
      model: 'MacBook Pro 14',
      serialNumber: 'C02DXXKX1234',
      assignedUser: 'Mario Rossi',
      businessUnit: 'Marketing',
      assignmentDate: '10/01/2023'
    },
    {
      id: '2',
      status: 'assigned',
      statusLabel: 'Assegnato',
      brand: 'Dell',
      model: 'Latitude 7420',
      serialNumber: 'FG5HXXXX5678',
      assignedUser: 'Giulia Bianchi',
      businessUnit: 'Vendite',
      assignmentDate: '15/02/2023'
    },
    {
      id: '3',
      status: 'dismissed',
      statusLabel: 'Dismesso',
      brand: 'Lenovo',
      model: 'ThinkPad X1',
      serialNumber: 'PF2AXXXX4321',
      assignedUser: '-',
      businessUnit: '-',
      assignmentDate: '01/06/2024'
    },
    {
      id: '4',
      status: 'available',
      statusLabel: 'Disponibile',
      brand: 'Samsung',
      model: 'Galaxy S23',
      serialNumber: 'RF8TXXXX3456',
      assignedUser: '-',
      businessUnit: '-',
      assignmentDate: '-'
    },
    {
      id: '5',
      status: 'dismissed',
      statusLabel: 'Dismesso',
      brand: 'Vodafone',
      model: 'SIM Dati',
      serialNumber: '893BXXXXXXXX789',
      assignedUser: 'Mario Rossi',
      businessUnit: 'Marketing',
      assignmentDate: '25/05/2024'
    }
  ]);

  // Assets filtrati in base ai filtri correnti
  filteredAssets = computed(() => {
    const filters = this.currentFilters();
    let assets = this.allAssets();

    // Filtra per Business Unit
    if (filters['businessUnit']) {
      assets = assets.filter(a => a.businessUnit === filters['businessUnit']);
    }

    // Filtra per Status
    if (filters['status']) {
      assets = assets.filter(a => a.status === filters['status']);
    }

    // Filtra per Nome (search)
    if (filters['searchName']) {
      const search = filters['searchName'].toLowerCase();
      assets = assets.filter(a => 
        a.assignedUser.toLowerCase().includes(search)
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

  constructor(private router: Router) {}

  ngOnInit(): void {
    console.log('Asset list initialized');
  }

  // ✅ SOSTITUISCI applyFilters con onFiltersChange
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