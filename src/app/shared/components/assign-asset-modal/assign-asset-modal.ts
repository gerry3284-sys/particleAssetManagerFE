import { Component, OnDestroy, computed, effect, inject, input, output, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AssignAssetForm } from '../../models/asset.interface';
import { FilterService } from '../../services/filter.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';
import { DropdownSearchComponent } from '../dropdown-search/dropdown-search';
import { DropdownOption } from '../../models/dropdown-option.interface';
import { ButtonComponent } from '../button/button';

interface UserOption {
  id: string;
  name: string;
  surname: string;
  businessUnit?: string;
}

@Component({
  selector: 'app-assign-asset-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, DropdownSearchComponent, ButtonComponent],
  templateUrl: './assign-asset-modal.html',
  styleUrl: './assign-asset-modal.css',
})
export class AssignAssetModalComponent implements OnDestroy {
  private platformId = inject(PLATFORM_ID);
  private readonly filterService = inject(FilterService);
  private escListenerAttached = false;
  isOpen = input<boolean>(false);
  assetId = input<string>('');
  users = input<UserOption[]>([]);

  close = output<void>();
  assign = output<AssignAssetForm>();

  private fallbackUsers: UserOption[] = [];

  apiUsers = toSignal(
    this.filterService.getUsers().pipe(
      catchError(err => {
        console.error('Errore caricamento utenti:', err);
        return of([]);
      })
    ),
    { initialValue: [] }
  );

  // assignmentDate = signal('');
  selectedUserId = signal('');
  notes = signal('');

  // dateError = signal(false);
  userError = signal(false);

  availableUsers = computed(() => {
    const external = this.users();
    if (external.length) {
      return external;
    }

    const api = this.apiUsers();
    if (api.length) {
      return api.map(user => ({
        id: String(user.id),
        name: user.name,
        surname: user.surname,
        businessUnit: user.businessUnit?.name
      }));
    }

    return this.fallbackUsers;
  });

  userOptions = computed<DropdownOption[]>(() =>
    this.availableUsers().map(user => ({
      value: user.id,
      label: `${user.name} ${user.surname}`,
      subLabel: user.businessUnit
    }))
  );

  selectedUser = computed(() =>
    this.availableUsers().find(user => user.id === this.selectedUserId()) ?? null
  );

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

  // onDateChange(value: string): void {
  //   this.assignmentDate.set(value);
  //   this.dateError.set(false);
  // }

  submit(): void {
    const user = this.selectedUser();
    this.userError.set(!user);

    if (!user) {
      return;
    }

    this.assign.emit({
      userId: user.id,
      userName: `${user.name} ${user.surname}`,
      notes: this.notes().trim() || undefined,
    });
  }

  private resetForm(): void {
    this.selectedUserId.set('');
    this.notes.set('');
    this.userError.set(false);
  }

  // private getTodayDate(): string {
  //   const today = new Date();
  //   const year = today.getFullYear();
  //   const month = String(today.getMonth() + 1).padStart(2, '0');
  //   const day = String(today.getDate()).padStart(2, '0');
  //   return `${year}-${month}-${day}`;
  // }
  // alternativa al getTodayDate che pero puo avere problemi
  // se l'utente e' vicino a mezzanotte e il fuso orario differisce.
  // private getTodayDate(): string {
  //   return new Date().toISOString().split('T')[0];
  // }

  
}
