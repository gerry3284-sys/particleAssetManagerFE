import { Component, computed, effect, input, output, signal, inject, OnDestroy } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonComponent } from '../../../../shared/components/button/button';
import { DropdownComponent } from '../../../../shared/components/dropdown/dropdown';
import { DropdownOption } from '../../../../shared/models/dropdown-option.interface';

export interface ReturnCertifyForm {
  notes?: string;
}

@Component({
  selector: 'app-return-certify-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent, DropdownComponent],
  templateUrl: './return-certify-modal.html',
  styleUrl: './return-certify-modal.css'
})
export class ReturnCertifyModalComponent implements OnDestroy {
  private platformId = inject(PLATFORM_ID);
  private escListenerAttached = false;
  isOpen = input<boolean>(false);
  assetSummary = input<string>('');

  close = output<void>();
  confirm = output<ReturnCertifyForm>();

  reason = signal('');
  privateEmail = signal('');
  notes = signal('');

  reasonError = signal(false);
  emailError = signal(false);

  reasons: DropdownOption[] = [
    { value: 'resignation', label: 'Dimissioni' },
    { value: 'change', label: 'Cambio' }
  ];

  subtitle = computed(() => {
    const asset = this.assetSummary().trim();
    if (!asset) {
      return "Stai certificando la riconsegna dell'asset.";
    }
    return `Stai certificando la riconsegna dell'asset ${asset}.`;
  });

  isResignation = computed(() => this.reason() === 'resignation');

  constructor() {
    effect(() => {
      if (this.isOpen()) {
        this.resetForm();
        if (isPlatformBrowser(this.platformId)) {
          document.body.classList.add('modal-open');
          document.documentElement.classList.add('modal-open');
          this.attachEscListener();
        }
      } else {
        if (isPlatformBrowser(this.platformId)) {
          document.body.classList.remove('modal-open');
          document.documentElement.classList.remove('modal-open');
          this.detachEscListener();
        }
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

  submit(): void {
    const reason = this.reason();
    const email = this.privateEmail().trim();
    const requiresEmail = reason === 'resignation';
    const emailValid = this.isEmailValid(email);

    this.reasonError.set(!reason);
    this.emailError.set(requiresEmail && !emailValid);

    if (!reason || (requiresEmail && !emailValid)) {
      return;
    }

    this.confirm.emit({
      notes: this.notes().trim() || undefined
    });
  }

  onReasonChange(value: string): void {
    this.reason.set(value);
    this.reasonError.set(false);

    if (value !== 'resignation') {
      this.privateEmail.set('');
      this.emailError.set(false);
    }
  }

  onPrivateEmailInput(value: string): void {
    this.privateEmail.set(value);
    if (this.emailError()) {
      this.emailError.set(false);
    }
  }

  private isEmailValid(email: string): boolean {
    return !!email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  private resetForm(): void {
    this.reason.set('');
    this.privateEmail.set('');
    this.notes.set('');
    this.reasonError.set(false);
    this.emailError.set(false);
  }
}
