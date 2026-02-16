import { Component, OnDestroy, computed, effect, inject, input, output, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AssignAssetForm } from '../../models/asset.interface';

interface UserOption {
  id: string;
  name: string;
  businessUnit?: string;
}

@Component({
  selector: 'app-assign-asset-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './assign-asset-modal.html',
  styleUrl: './assign-asset-modal.css',
})
export class AssignAssetModalComponent implements OnDestroy {
  private platformId = inject(PLATFORM_ID);
  private escListenerAttached = false;
  isOpen = input<boolean>(false);
  assetId = input<string>('');
  users = input<UserOption[]>([]);

  close = output<void>();
  assign = output<AssignAssetForm>();

  private fallbackUsers: UserOption[] = [
    { id: 'u1', name: 'Mario Rossi', businessUnit: 'Marketing' },
    { id: 'u2', name: 'Giulia Bianchi', businessUnit: 'Vendite' },
    { id: 'u3', name: 'Luca Verdi', businessUnit: 'IT' },
    { id: 'u4', name: 'Sara Neri', businessUnit: 'HR' },
    { id: 'u5', name: 'Paolo Gallo', businessUnit: 'Marketing' },
  ];

  assignmentDate = signal('');
  searchTerm = signal('');
  selectedUser = signal<UserOption | null>(null);
  notes = signal('');
  dropdownOpen = signal(false);

  dateError = signal(false);
  userError = signal(false);

  availableUsers = computed(() => {
    const external = this.users();
    return external.length ? external : this.fallbackUsers;
  });

  filteredUsers = computed(() => {
    const query = this.searchTerm().trim().toLowerCase();
    const users = this.availableUsers();
    if (!query) {
      return users;
    }
    return users.filter((u) => u.name.toLowerCase().includes(query));
  });

  constructor() {
    effect(() => {
      if (this.isOpen()) {
        this.resetForm();
        if (isPlatformBrowser(this.platformId)) {
          document.body.classList.add('modal-open');
          this.attachEscListener();
        }
      } else {
        if (isPlatformBrowser(this.platformId)) {
          document.body.classList.remove('modal-open');
          this.detachEscListener();
        }
      }
    });
  }

  ngOnDestroy(): void {
    if (isPlatformBrowser(this.platformId)) {
      document.body.classList.remove('modal-open');
      this.detachEscListener();
    }
  }

  closeModal(): void {
    this.close.emit();
  }

  private handleEsc = (event: KeyboardEvent): void => {
    if (event.key === 'Escape') {
      this.closeModal();
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

  onOverlayClick(): void {
    this.close.emit();
  }

  onInputFocus(): void {
    this.dropdownOpen.set(true);
  }

  onInputBlur(): void {
    setTimeout(() => this.dropdownOpen.set(false), 150);
  }

  onUserSelect(user: UserOption): void {
    this.selectedUser.set(user);
    this.searchTerm.set(user.name);
    this.dropdownOpen.set(false);
    this.userError.set(false);
  }

  onSearchChange(value: string): void {
    this.searchTerm.set(value);
    this.selectedUser.set(null);
    this.userError.set(false);
  }

  onDateChange(value: string): void {
    this.assignmentDate.set(value);
    this.dateError.set(false);
  }

  submit(): void {
    const date = this.assignmentDate();
    const user = this.selectedUser();

    this.dateError.set(!date);
    this.userError.set(!user);

    if (!date || !user) {
      return;
    }

    this.assign.emit({
      assignmentDate: date,
      userId: user.id,
      userName: user.name,
      notes: this.notes().trim() || undefined,
    });
  }

  private resetForm(): void {
    this.assignmentDate.set('');
    this.searchTerm.set('');
    this.selectedUser.set(null);
    this.notes.set('');
    this.dropdownOpen.set(false);
    this.dateError.set(false);
    this.userError.set(false);
  }
}
