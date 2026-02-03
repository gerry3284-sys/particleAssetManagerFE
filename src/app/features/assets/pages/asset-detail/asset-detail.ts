import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AssignAssetModalComponent } from '../../../../shared/components/assign-asset-modal/assign-asset-modal';
import { AssetDetail, AssignAssetForm } from '../../../../shared/models/asset.interface';

@Component({
  selector: 'app-asset-detail',
  standalone: true,
  imports: [CommonModule, AssignAssetModalComponent],
  templateUrl: './asset-detail.html',
  styleUrl: './asset-detail.css'
})
export class AssetDetailComponent implements OnInit {
  
  assetId = signal<string>('');
  asset = signal<AssetDetail | null>(null);
  isLoading = signal<boolean>(true);

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}
   showAssignModal = signal(false);

  ngOnInit(): void {
    // Ottieni l'ID dall'URL
    this.route.params.subscribe(params => {
      this.assetId.set(params['id']);
      this.loadAssetDetail(params['id']);
    });
  }

  // Carica i dettagli dell'asset (mock data)
  loadAssetDetail(id: string): void {
    this.isLoading.set(true);

    // TODO: Sostituire con chiamata al servizio API
    setTimeout(() => {
      // Mock data
      const mockAsset: AssetDetail = {
        id: id,
        businessUnit: 'Particle',
        brand: 'Apple',
        model: 'MacBook Pro 14"',
        serialNumber: 'C02G8R3JMD6M',
        assignedUser: null,
        assignedUserId: null,
        assignmentDate: null,
        returnDate: null,
        notes: '-',
        status: 'available',
        statusLabel: 'Disponibile',
        typology: 'Laptop',
        movements: [
          {
            id: '1',
            date: '15/05/2025',
            user: 'Mario Rossi',
            userId: '123',
            movementType: 'assigned',
            movementLabel: 'Assegnato'
          }
        ]
      };

      this.asset.set(mockAsset);
      this.isLoading.set(false);
    }, 500);
  }

  // Torna alla lista
  goBack(): void {
    this.router.navigate(['/assets']);
  }

  // Assegna asset
  assignAsset(): void {
    this.showAssignModal.set(true); // Apertura  modale
  }
  closeAssignModal(): void {
    this.showAssignModal.set(false);
  }
  onAssetAssigned(formData: AssignAssetForm): void {
    console.log('Asset assegnato:', formData);
    
    // TODO: Chiamare API per assegnare l'asset
    // this.assetService.assignAsset(this.assetId(), formData).subscribe(...)
    
    // Simulazione
    alert(`Asset assegnato a ${formData.userName} il ${formData.assignmentDate}`);
    
    // Chiudi modale
    this.closeAssignModal();
    
    // Ricarica dettaglio asset
    this.loadAssetDetail(this.assetId());
  }

  // Certifica riconsegna
  certifyReturn(): void {
    console.log('Certifica riconsegna:', this.assetId());
    // TODO: Implementare modale riconsegna
    alert('Funzionalità "Certifica Riconsegna" in sviluppo');
  }

  // Dismetti asset
  dismissAsset(): void {
    if (confirm('Sei sicuro di voler dismettere questo asset? L\'operazione non è reversibile.')) {
      console.log('Dismetti asset:', this.assetId());
      // TODO: Implementare chiamata API dismissione
      alert('Asset dismesso con successo');
      this.goBack();
    }
  }

  // Naviga al dettaglio movimento (click su riga)
  goToMovementDetail(movementId: string): void {
    console.log('Dettaglio movimento:', movementId);
    // TODO: Implementare navigazione o modale dettaglio movimento
  }

  // Helper per lo stato
  getStatusClass(): string {
    const status = this.asset()?.status;
    switch (status) {
      case 'assigned':
        return 'status-assigned';
      case 'available':
        return 'status-available';
      case 'dismissed':
        return 'status-dismissed';
      default:
        return '';
    }
  }
}