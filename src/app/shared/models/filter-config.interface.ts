/**
 * Opzione per un filtro select.
 * Esempio: { value: 'marketing', label: 'Marketing' }
 */
export interface FilterOption {
  value: string;    // Valore tecnico (usato nel codice)
  label: string;    // Etichetta mostrata all'utente
}

/**
 * Configurazione di un singolo campo filtro.
 * Indica se è una select o un input di ricerca.
 */
export interface FilterField {
  key: string;                    // Identificatore univoco (es: 'businessUnit')
  label: string;                  // Etichetta visualizzata (es: 'Business Unit')
  type: 'select' | 'search';      // Tipo di filtro
  placeholder?: string;           // Placeholder per input search (opzionale)
  options?: FilterOption[];       // Opzioni per select (opzionale)
}

/**
 * Valori correnti dei filtri (chiavi dinamiche).
 * Esempio: { businessUnit: 'Marketing', status: 'assigned', searchName: 'Mario' }
 */
export interface FilterValues {
  [key: string]: string;  // Chiave -> valore
}