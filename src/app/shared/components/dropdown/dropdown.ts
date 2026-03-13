import { CommonModule } from '@angular/common';
import { Component, computed, effect, forwardRef, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { DropdownOption } from '../../models/dropdown-option.interface';

@Component({
  selector: 'app-dropdown',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dropdown.html',
  styleUrl: './dropdown.css',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DropdownComponent),
      multi: true
    }
  ]
})
export class DropdownComponent implements ControlValueAccessor {
  options = input<DropdownOption[]>([]);
  placeholder = input('Seleziona...');
  emptyLabel = input('Nessun risultato');
  error = input(false);

  dropdownOpen = signal(false);
  value = signal('');
  isDisabled = signal(false);

  selectedOption = computed(() =>
    this.options().find(option => option.value === this.value()) ?? null
  );

  // Show placeholder until a real option is selected.
  displayLabel = computed(() => this.selectedOption()?.label ?? this.placeholder());

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  constructor() {
    effect(() => {
      if (this.isDisabled()) {
        this.dropdownOpen.set(false);
      }
    });
  }

  writeValue(value: string | null): void {
    // Called by Angular forms when the model changes.
    this.value.set(value ?? '');
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled.set(isDisabled);
  }

  toggleDropdown(): void {
    if (this.isDisabled()) {
      return;
    }
    this.dropdownOpen.set(!this.dropdownOpen());
  }

  closeDropdown(): void {
    this.dropdownOpen.set(false);
    this.onTouched();
  }

  selectOption(option: DropdownOption): void {
    if (this.isDisabled()) {
      return;
    }
    // Propagate selection to the form control.
    this.value.set(option.value);
    this.onChange(option.value);
    this.closeDropdown();
  }
}
