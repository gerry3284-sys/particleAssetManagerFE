// asset-list.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

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
  imports: [CommonModule, FormsModule],
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

  // Dati tabella (statici per ora)
  assets: Asset[] = [
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
  ];

  // Paginazione
  currentPage = 1;
  itemsPerPage = 5;
  totalItems = 100;

  constructor(private router: Router) {}

  ngOnInit(): void {
    // Qui in futuro caricherai i dati dal servizio
    console.log('Asset list initialized');
  }

  // Naviga al dettaglio asset
  goToAssetDetail(assetId: string): void {
    this.router.navigate(['/assets', assetId]);
  }

  // Naviga alla creazione nuovo asset
  createNewAsset(): void {
    this.router.navigate(['/assets/new']);
  }

  // Applica filtri
  applyFilters(): void {
    console.log('Filtri applicati:', this.filters);
    // Qui implementerai la logica di filtro
  }

  // Cambia pagina
  goToPage(page: number): void {
    this.currentPage = page;
    console.log('Pagina:', page);
    // Qui caricherai i dati della pagina
  }

  // Calcola range visualizzato
  get displayRange(): string {
    const start = (this.currentPage - 1) * this.itemsPerPage + 1;
    const end = Math.min(this.currentPage * this.itemsPerPage, this.totalItems);
    return `${start}-${end}`;
  }

  // Calcola numero totale pagine
  get totalPages(): number {
    return Math.ceil(this.totalItems / this.itemsPerPage);
  }
}