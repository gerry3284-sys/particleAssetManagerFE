import { Component, computed, effect, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DropdownComponent } from '../dropdown/dropdown';
import { DropdownOption } from '../../models/dropdown-option.interface';
import { ButtonComponent } from '../button/button';

export interface DismissAssetForm {
  reason: string;
  notes: string;
}

@Component({
  selector: 'app-dismiss-asset-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, DropdownComponent, ButtonComponent],
  templateUrl: './dismiss-asset-modal.html',
  styleUrl: './dismiss-asset-modal.css'
})
export class DismissAssetModalComponent {
  isOpen = input<boolean>(false);
  assetSummary = input<string>('');

  close = output<void>();
  confirm = output<DismissAssetForm>();

  reason = signal('');
  notes = signal('');

  reasonError = signal(false);
  notesError = signal(false);

  reasons = [
    { value: 'obsolete', label: 'Asset obsoleto' },
    { value: 'broken', label: 'Asset guasto' },
    { value: 'other', label: 'Altro' }
  ];

  reasonOptions = computed<DropdownOption[]>(() => this.reasons);

  subtitle = computed(() => {
    const asset = this.assetSummary().trim();
    if (!asset) {
      return 'Sei sicuro di voler dismettere questo asset?';
    }
    return `Sei sicuro di voler dismettere l'asset ${asset}?`;
  });

  constructor() {
    effect(() => {
      if (this.isOpen()) {
        this.resetForm();
      }
    });
  }

  onOverlayClick(): void {
    this.close.emit();
  }

  submit(): void {
    const reason = this.reason().trim();
    const notes = this.notes().trim();

    this.reasonError.set(!reason);
    this.notesError.set(!notes);

    if (!reason || !notes) {
      return;
    }

    this.confirm.emit({
      reason,
      notes
    });
  }

  private resetForm(): void {
    this.reason.set('');
    this.notes.set('');
    this.reasonError.set(false);
    this.notesError.set(false);
  }
}
