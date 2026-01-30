import { Component, input, output, effect, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FilterField, FilterValues } from '../../models/filter-config.interface';

@Component({
  selector: 'app-filters',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './filters.html',
  styleUrl: './filters.css'
})
export class FiltersComponent {
  // Input: configurazione dei filtri da mostrare
  fields = input.required<FilterField[]>();
  
  // Input: valori iniziali dei filtri (opzionale)
  initialValues = input<FilterValues>({});
  
  // Output: emette i valori dei filtri quando cambiano
  filtersChange = output<FilterValues>();
  
  //  Signal interno per gestire i valori correnti
  filterValues = signal<FilterValues>({});

  constructor() {
    // Inizializza i valori quando il componente viene creato
    effect(() => {
      const initial = this.initialValues();
      const fields = this.fields();
      
      // Crea un oggetto con tutti i campi inizializzati
      const values: FilterValues = {};
      fields.forEach(field => {
        values[field.key] = initial[field.key] || '';
      });
      
      this.filterValues.set(values);
    });
  }

  //  Metodo chiamato quando un filtro cambia
  onFilterChange(key: string, value: string): void {
    // Aggiorna il signal
    this.filterValues.update(current => ({
      ...current,
      [key]: value
    }));
    
    // Emetti i nuovi valori al componente parent
    this.filtersChange.emit(this.filterValues());
  }

  // Metodo per resettare tutti i filtri (opzionale, per uso futuro)
  resetFilters(): void {
    const resetValues: FilterValues = {};
    this.fields().forEach(field => {
      resetValues[field.key] = '';
    });
    this.filterValues.set(resetValues);
    this.filtersChange.emit(this.filterValues());
  }

  // Helper per ottenere il valore corrente di un filtro
  getFilterValue(key: string): string {
    return this.filterValues()[key] || '';
  }
}