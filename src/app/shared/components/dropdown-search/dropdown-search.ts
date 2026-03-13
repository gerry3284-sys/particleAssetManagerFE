import { CommonModule } from '@angular/common';
import { Component, computed, effect, forwardRef, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { DropdownOption } from '../../models/dropdown-option.interface';

@Component({
  selector: 'app-dropdown-search',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dropdown-search.html',
  styleUrl: './dropdown-search.css',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DropdownSearchComponent),
      multi: true
    }
  ]
})
export class DropdownSearchComponent implements ControlValueAccessor {
  options = input<DropdownOption[]>([]);
  placeholder = input('Inizia a scrivere...');
  emptyLabel = input('Nessun risultato');
  error = input(false);

  dropdownOpen = signal(false);
  searchTerm = signal('');
  value = signal('');
  isDisabled = signal(false);

  filteredOptions = computed(() => {
    const query = this.searchTerm().trim().toLowerCase();
    const options = this.options();
    if (!query) {
      return options;
    }
    return options.filter(option => option.label.toLowerCase().includes(query));
  });

  // Keep selected value in sync with the input text.
  selectedOption = computed(() =>
    this.options().find(option => option.value === this.value()) ?? null
  );

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  constructor() {
    effect(() => {
      if (this.isDisabled()) {
        this.dropdownOpen.set(false);
      }
    });

    effect(() => {
      if (this.dropdownOpen()) {
        return;
      }
      const currentValue = this.value();
      if (!currentValue) {
        if (this.searchTerm()) {
          this.searchTerm.set('');
        }
        return;
      }
      const selected = this.options().find(option => option.value === currentValue);
      if (selected && this.searchTerm() !== selected.label) {
        this.searchTerm.set(selected.label);
      }
    });
  }

  writeValue(value: string | null): void {
    // Called by Angular forms when the model changes.
    this.value.set(value ?? '');
    const selected = this.options().find(option => option.value === (value ?? ''));
    this.searchTerm.set(selected?.label ?? '');
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

  onInputFocus(): void {
    if (this.isDisabled()) {
      return;
    }
    this.dropdownOpen.set(true);
  }

  onInputBlur(): void {
    setTimeout(() => {
      this.dropdownOpen.set(false);
      this.onTouched();
    }, 150);
  }

  onSearchChange(value: string): void {
    this.searchTerm.set(value);
    const selectedLabel = this.selectedOption()?.label ?? '';
    // If user edits the text, clear the current selection.
    if (value !== selectedLabel) {
      this.value.set('');
      this.onChange('');
    }
  }

  selectOption(option: DropdownOption): void {
    if (this.isDisabled()) {
      return;
    }
    this.value.set(option.value);
    this.searchTerm.set(option.label);
    this.dropdownOpen.set(false);
    this.onChange(option.value);
  }
}
