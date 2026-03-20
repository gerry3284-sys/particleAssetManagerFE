import { Component, effect, inject, input, OnDestroy, output, signal } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PLATFORM_ID } from '@angular/core';
import { ButtonComponent } from '../../../../shared/components/button/button';

export interface EditAssetStatusTypeForm {
  name: string;
}

@Component({
  selector: 'app-edit-asset-status-type-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent],
  templateUrl: './edit-asset-status-type-modal.html',
  styleUrl: './edit-asset-status-type-modal.css'
})
export class EditAssetStatusTypeModalComponent implements OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  private escListenerAttached = false;

  isOpen = input(false);
  currentName = input('');

  close = output<void>();
  confirm = output<EditAssetStatusTypeForm>();

  name = signal('');
  nameError = signal(false);

  constructor() {
    effect(() => {
      if (this.isOpen()) {
        this.resetForm();
        if (isPlatformBrowser(this.platformId)) {
          document.body.classList.add('modal-open');
          document.documentElement.classList.add('modal-open');
          this.attachEscListener();
        }
      } else if (isPlatformBrowser(this.platformId)) {
        document.body.classList.remove('modal-open');
        document.documentElement.classList.remove('modal-open');
        this.detachEscListener();
      }
    });
  }

  ngOnDestroy(): void {
    if (isPlatformBrowser(this.platformId)) {
      document.body.classList.remove('modal-open');
      document.documentElement.classList.remove('modal-open');
      this.detachEscListener();
    }
  }

  onOverlayClick(): void {
    this.close.emit();
  }

  onNameChange(value: string): void {
    this.name.set(value);
    if (this.nameError()) {
      this.nameError.set(false);
    }
  }

  submit(): void {
    const value = this.name().trim();
    this.nameError.set(!value);

    if (!value) {
      return;
    }

    this.confirm.emit({ name: value });
  }

  private handleEsc = (event: KeyboardEvent): void => {
    if (event.key === 'Escape') {
      this.close.emit();
    }
  };

  private attachEscListener(): void {
    if (!this.escListenerAttached) {
      document.addEventListener('keydown', this.handleEsc);
      this.escListenerAttached = true;
    }
  }

  private detachEscListener(): void {
    if (this.escListenerAttached) {
      document.removeEventListener('keydown', this.handleEsc);
      this.escListenerAttached = false;
    }
  }

  private resetForm(): void {
    this.name.set(this.currentName().trim());
    this.nameError.set(false);
  }
}
