import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { catchError, of, tap } from 'rxjs';

export interface Branch {
  id: number;
  name: string;
}

@Injectable({ providedIn: 'root' })
export class BranchService {
  private http = inject(HttpClient);

  branches = signal<Branch[]>([]);
  names = computed(() => this.branches().map((b) => b.name));
  current = signal('Downtown');

  load() {
    return this.http.get<Branch[]>('data/branches.json').pipe(
      tap((list) => this.branches.set(list)),
      catchError(() => of([] as Branch[])),
    );
  }

  set(name: string) {
    this.current.set(name);
  }
}
