import { Injectable, signal } from '@angular/core';

export function matches(text: string, term: string) {
  const t = term.trim().toLowerCase();
  return !t || text.toLowerCase().includes(t);
}

@Injectable({ providedIn: 'root' })
export class SearchService {
  term = signal('');

  set(value: string) {
    this.term.set(value);
  }

  clear() {
    this.term.set('');
  }
}
