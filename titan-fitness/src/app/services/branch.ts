import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class Branch {
  current = signal('Downtown');

  set(name: string) {
    this.current.set(name);
  }
}
