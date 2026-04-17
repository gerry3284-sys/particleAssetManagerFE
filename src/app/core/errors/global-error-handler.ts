import { ErrorHandler, Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  handleError(error: unknown): void {
    if (error instanceof HttpErrorResponse) {
      const formatted = this.formatHttpError(error);
      console.error(formatted);
      return;
    }

    console.error(error);
  }

  private formatHttpError(error: HttpErrorResponse): string {
    const url = error.url ?? 'URL sconosciuto';

    if (error.status === 0) {
      return `Errore di rete: backend non raggiungibile (${url}). Verifica che il backend sia attivo e in ascolto su localhost:8080.`;
    }

    return `Errore HTTP ${error.status} su ${url}: ${error.message}`;
  }
}