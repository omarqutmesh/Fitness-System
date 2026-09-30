import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class Search {
  term = signal('');

  set(value: string) {
    this.term.set(value.trim());
  }

  clear() {
    this.term.set('');
  }
}
