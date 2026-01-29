
// asset-list.component.ts
import { Component, OnInit, signal, computed } from '@angular/core'; // ← Aggiungi signal e computed
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination';


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
  imports: [CommonModule, FormsModule, PaginationComponent],
  templateUrl: './asset-list.html',
  styleUrls: ['./asset-list.css']
})
export class AssetListComponent implements OnInit {
  
  // Filtri
  filters = {
    typology: 'Tutte le Tipologie',
    businessUnit: 'Tutte le BU',
    status: 'Tutti gli Stati',
    searchName: ''
  };

  // signal 
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
    },
    
  ]);

  
  currentPage = signal(1);
  
  
  itemsPerPage = signal(5);

  // ricalcolo e aggiorno  automaticamente quando allAssets o itemsPerPage cambiano
  totalPages = computed(() => {
    return Math.ceil(this.allAssets().length / this.itemsPerPage());
  });

  // paginatedAssets si aggiorna automaticamente quando cambi pagina o aggiungi/rimuovi assets
  paginatedAssets = computed(() => {
    const start = (this.currentPage() - 1) * this.itemsPerPage();
    const end = start + this.itemsPerPage();
    return this.allAssets().slice(start, end);
  });

  //creazione stringa display range. 
  displayRange = computed(() => {
    const start = (this.currentPage() - 1) * this.itemsPerPage() + 1;
    const end = Math.min(this.currentPage() * this.itemsPerPage(), this.allAssets().length);
    return `Mostrando ${start}-${end} di ${this.allAssets().length}`;
  });

  constructor(private router: Router) {}

  ngOnInit(): void {
    // Qui in futuro caricherai i dati dal servizio
    console.log('Asset list initialized');
  }

  // Naviga al dettaglio asset
  goToAssetDetail(assetId: string): void {
    // TODO: abilita quando esisterà il componente dettaglio
    return;
  }

  // Naviga alla creazione nuovo asset
  createNewAsset(): void {
    // TODO: abilita quando esisterà il componente creazione
    return;
  }

  // Applica filtri
  applyFilters(): void {
    console.log('Filtri applicati:', this.filters);
    // Implementare logica filtro qui 
  }

  //  Aggiorna goToPage per usare signals
  goToPage(page: number): void {
    this.currentPage.set(page); 
    console.log('Pagina:', page);
    
    //scroll alla tabella
    const tableCard = document.querySelector('.table-card');
    if (tableCard) {
      tableCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}