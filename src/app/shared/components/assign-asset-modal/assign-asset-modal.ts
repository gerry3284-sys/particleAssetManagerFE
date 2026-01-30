import { Component, output, input, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AssignAssetForm } from '../../models/asset.interface';

@Component({
  selector: 'app-assign-asset-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './assign-asset-modal.html',
  styleUrl: './assign-asset-modal.css'
})
export class AssignAssetModalComponent {
  
  // Input/Output
  isOpen = input<boolean>(false);
  assetId = input<string>('');
  close = output<void>();
  assign = output<AssignAssetForm>();
  
  // Form data
  formData = signal<AssignAssetForm>({
    assignmentDate: this.getTodayDate(),
    userId: '',
    userName: '',
    notes: ''
  });
  
  // Lista utenti (mock - sostituire con API)
  users = signal([
    { id: '1', name: 'Mario Rossi', businessUnit: 'Marketing' },
    { id: '2', name: 'Giulia Bianchi', businessUnit: 'Vendite' },
    { id: '3', name: 'Luca Verdi', businessUnit: 'IT' },
    { id: '4', name: 'Anna Neri', businessUnit: 'HR' },
    { id: '5', name: 'Paolo Gialli', businessUnit: 'Marketing' },
    { id: '6', name: 'Sara Viola', businessUnit: 'Vendite' }
  ]);
  
  // Stato dropdown
  showUserDropdown = signal(false);
  userSearchQuery = signal('');
  filteredUsers = signal(this.users());
  
  constructor() {
    // Reset form quando la modale si chiude
    effect(() => {
      if (!this.isOpen()) {
        this.resetForm();
      }
    });
  }
  
  // Ottiene la data odierna in formato YYYY-MM-DD
  getTodayDate(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  
  // Chiude la modale
  onClose(): void {
    this.close.emit();
  }
  
  // Chiude la modale cliccando sul backdrop
  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.onClose();
    }
  }
  
  // Annulla e chiudi
  onCancel(): void {
    if (confirm('Sei sicuro di voler annullare? I dati inseriti andranno persi.')) {
      this.onClose();
    }
  }
  
  // Gestisce input utente
  onUserInputChange(value: string): void {
    this.userSearchQuery.set(value);
    this.filterUsers(value);
    this.showUserDropdown.set(true);
  }
  
  // Filtra utenti in base alla ricerca
  filterUsers(query: string): void {
    if (!query || query.trim() === '') {
      this.filteredUsers.set(this.users());
      return;
    }
    
    const searchLower = query.toLowerCase();
    const filtered = this.users().filter(user => 
      user.name.toLowerCase().includes(searchLower) ||
      user.businessUnit.toLowerCase().includes(searchLower)
    );
    
    this.filteredUsers.set(filtered);
  }
  
  // Seleziona utente dal dropdown
  selectUser(user: { id: string; name: string; businessUnit: string }): void {
    this.formData.update(current => ({
      ...current,
      userId: user.id,
      userName: user.name
    }));
    this.userSearchQuery.set(user.name);
    this.showUserDropdown.set(false);
  }
  
  // Apre il dropdown
  openUserDropdown(): void {
    this.filterUsers(this.userSearchQuery());
    this.showUserDropdown.set(true);
  }
  
  // Chiude il dropdown con delay
  closeUserDropdown(): void {
    setTimeout(() => {
      this.showUserDropdown.set(false);
    }, 200);
  }
  
  // Valida il form
  isFormValid(): boolean {
    const data = this.formData();
    return !!(data.assignmentDate && data.userId);
  }
  
  // Assegna asset
  onAssign(): void {
    if (!this.isFormValid()) {
      alert('Compila tutti i campi obbligatori');
      return;
    }
    
    this.assign.emit(this.formData());
  }
  
  // Aggiorna un campo del form
  updateField(field: keyof AssignAssetForm, value: string): void {
    this.formData.update(current => ({
      ...current,
      [field]: value
    }));
  }
  
  // Reset del form
  resetForm(): void {
    this.formData.set({
      assignmentDate: this.getTodayDate(),
      userId: '',
      userName: '',
      notes: ''
    });
    this.userSearchQuery.set('');
    this.showUserDropdown.set(false);
    this.filteredUsers.set(this.users());
  }
}