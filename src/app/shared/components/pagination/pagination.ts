import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pagination.html',
  styleUrl: './pagination.css'
})
export class PaginationComponent {
  // Input signals
  currentPage = input<number>(1);
  totalPages = input<number>(1);
  maxVisible = input<number>(5);
  
  // Output (Angular 21 - nuovo modo)
  pageChange = output<number>();

  // Calcola le pagine visibili
  visiblePages(): number[] {
    const current = this.currentPage();
    const total = this.totalPages();
    const max = this.maxVisible();
    
    const pages: number[] = [];
    let start = Math.max(1, current - Math.floor(max / 2));
    let end = Math.min(total, start + max - 1);
    
    // Aggiusta se siamo vicino alla fine
    if (end - start < max - 1) {
      start = Math.max(1, end - max + 1);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  }

  // Vai a una pagina specifica
  goToPage(page: number): void {
    const current = this.currentPage();
    const total = this.totalPages();
    
    if (page >= 1 && page <= total && page !== current) {
      this.pageChange.emit(page);
    }
  }

  // Vai alla pagina precedente
  goToPrevious(): void {
    const current = this.currentPage();
    if (current > 1) {
      this.pageChange.emit(current - 1);
    }
  }

  // Vai alla pagina successiva
  goToNext(): void {
    const current = this.currentPage();
    const total = this.totalPages();
    
    if (current < total) {
      this.pageChange.emit(current + 1);
    }
  }
}