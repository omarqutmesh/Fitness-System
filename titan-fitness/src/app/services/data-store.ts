import { HttpClient } from '@angular/common/http';
import { inject, signal } from '@angular/core';
import { catchError, map, Observable, of, tap, throwError } from 'rxjs';

export interface Query<T> {
  filter?: (item: T) => boolean;
  sortKey?: string;
  sortDir?: 'asc' | 'desc';
  page: number;
  pageSize: number;
}

export abstract class DataStore<T extends { id: string | number }> {
  protected http = inject(HttpClient);
  protected abstract url: string;
  protected abstract storageKey: string;
  protected abstract nextId(): T['id'];

  items = signal<T[]>([]);
  loading = signal(false);
  failed = signal(false);
  private loaded = false;

  load(force = false): Observable<T[]> {
    if (this.loaded && !force) return of(this.items());

    this.loading.set(true);
    this.failed.set(false);

    return this.http.get<T[]>(this.url).pipe(
      tap((list) => {
        this.items.set(this.readSaved() ?? this.prepare(list));
        this.loaded = true;
        this.loading.set(false);
      }),
      map(() => this.items()),
      catchError((err) => {
        this.loading.set(false);
        this.failed.set(true);
        return throwError(() => err);
      }),
    );
  }

  protected prepare(list: any[]): T[] {
    return list as T[];
  }

  query(q: Query<T>) {
    const all = this.items().filter(q.filter ?? (() => true));

    if (q.sortKey) {
      const key = q.sortKey as keyof T;
      const dir = q.sortDir === 'desc' ? -1 : 1;
      all.sort((a, b) => {
        const x = a[key];
        const y = b[key];
        const r =
          typeof x === 'boolean'
            ? Number(x) - Number(y)
            : String(x).localeCompare(String(y), undefined, { numeric: true });
        return r * dir;
      });
    }

    const start = (q.page - 1) * q.pageSize;
    return { total: all.length, rows: all.slice(start, start + q.pageSize) };
  }

  getById(id: string | number): Observable<T | undefined> {
    return this.load().pipe(map((list) => list.find((i) => String(i.id) === String(id))));
  }

  create(data: Omit<T, 'id'>): Observable<T> {
    const item = { ...data, id: this.nextId() } as unknown as T;
    this.items.update((list) => [...list, item]);
    this.persist();
    return of(item);
  }

  update(id: T['id'], patch: Partial<Omit<T, 'id'>>): Observable<T> {
    const current = this.items().find((i) => i.id === id)!;
    const updated = { ...current, ...patch } as T;
    this.items.update((list) => list.map((i) => (i.id === id ? updated : i)));
    this.persist();
    return of(updated);
  }

  private readSaved(): T[] | null {
    try {
      const raw = localStorage.getItem(this.storageKey);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  private persist() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.items()));
    } catch {
      // storage full or blocked, data stays in memory
    }
  }
}
