import { Component, effect, inject, input, OnDestroy, output, signal } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonComponent } from '../../../../shared/components/button/button';

export interface CreateAssetStatusTypeForm {
  name: string;
}

@Component({
  selector: 'app-create-asset-status-type-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent],
  templateUrl: './create-asset-status-type-modal.html',
  styleUrl: './create-asset-status-type-modal.css'
})
export class CreateAssetStatusTypeModalComponent implements OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  private escListenerAttached = false;

  isOpen = input(false);

  close = output<void>();
  confirm = output<CreateAssetStatusTypeForm>();

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
    this.name.set('');
    this.nameError.set(false);
  }
}
