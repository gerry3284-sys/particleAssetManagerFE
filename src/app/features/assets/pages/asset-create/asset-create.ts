import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AssetCreateForm } from '../../../../shared/models/asset.interface';

@Component({
  selector: 'app-asset-create',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './asset-create.html',
  styleUrl: './asset-create.css'
})
export class AssetCreateComponent {
  
  // Signal per il form
  assetForm = signal<AssetCreateForm>({
    brand: '',
    model: '',
    typology: '',
    serialNumber: '',
    businessUnit: '',
    notes: ''
  });

  // Opzioni per le select
  typologyOptions = [
    { value: '', label: 'Seleziona una tipologia' },
    { value: 'laptop', label: 'Laptop' },
    { value: 'phone', label: 'Smartphone' },
    { value: 'tablet', label: 'Tablet' },
    { value: 'sim', label: 'SIM' }
  ];

  businessUnitOptions = [
    { value: '', label: 'Seleziona una Business Unit' },
    { value: 'Marketing', label: 'Marketing' },
    { value: 'Vendite', label: 'Vendite' },
    { value: 'IT', label: 'IT' },
    { value: 'HR', label: 'HR' }
  ];

  // Stato di submit
  isSubmitting = signal(false);

  constructor(private router: Router) {}

  // Torna alla lista
  goBack(): void {
    this.router.navigate(['/assets']);
  }

  // Annulla e torna indietro
  cancel(): void {
    if (confirm('Sei sicuro di voler annullare? Le modifiche non salvate andranno perse.')) {
      this.goBack();
    }
  }

  // Valida il form
  isFormValid(): boolean {
    const form = this.assetForm();
    return !!(
      form.brand &&
      form.model &&
      form.typology &&
      form.serialNumber &&
      form.businessUnit
    );
  }

  // Crea l'asset
  createAsset(): void {
    if (!this.isFormValid()) {
      alert('Compila tutti i campi obbligatori');
      return;
    }

    this.isSubmitting.set(true);

    // TODO: Chiamare il servizio API per creare l'asset
    console.log('Creazione asset:', this.assetForm());

    // Simulazione chiamata API
    setTimeout(() => {
      this.isSubmitting.set(false);
      alert('Asset creato con successo!');
      this.goBack();
    }, 1000);
  }

  // Update form field
  updateField(field: keyof AssetCreateForm, value: string): void {
    this.assetForm.update(current => ({
      ...current,
      [field]: value
    }));
  }
}