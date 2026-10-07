import { Component, input, OnInit, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Autofocus } from '../directives/autofocus';

export interface FilterConfig {
  key: string;
  label: string;
  type: 'multi' | 'checks' | 'radio' | 'range';
  options: string[];
  min?: number;
  max?: number;
}

@Component({
  selector: 'app-filter-dialog',
  imports: [FormsModule, Autofocus],
  templateUrl: './filter-dialog.html',
})
export class FilterDialog implements OnInit {
  title = input('Filter');
  filters = input.required<FilterConfig[]>();
  value = input<Record<string, any>>({});

  filtersApplied = output<Record<string, any>>();
  closed = output<void>();

  draft = signal<Record<string, any>>({});
  search = signal<Record<string, string>>({});

  ngOnInit() {
    this.draft.set({ ...this.value() });
  }

  selected(key: string): string[] {
    return this.draft()[key] ?? [];
  }

  has(key: string, option: string) {
    return this.selected(key).includes(option);
  }

  toggle(key: string, option: string) {
    const list = this.selected(key);
    const next = list.includes(option) ? list.filter((o) => o !== option) : [...list, option];
    this.draft.update((d) => ({ ...d, [key]: next }));
  }

  setRadio(key: string, option: string) {
    this.draft.update((d) => ({ ...d, [key]: option }));
  }

  setSearch(key: string, text: string) {
    this.search.update((s) => ({ ...s, [key]: text }));
  }

  visible(f: FilterConfig) {
    const t = (this.search()[f.key] ?? '').toLowerCase();
    return f.options.filter((o) => o.toLowerCase().includes(t));
  }

  clear() {
    this.draft.set({});
    this.search.set({});
  }

  apply() {
    this.filtersApplied.emit(this.draft());
  }
  rangeVal(key: string, side: 'min' | 'max'): number | '' {
    return this.draft()[key]?.[side] ?? '';
  }

  setRange(key: string, side: 'min' | 'max', raw: string) {
    const value = raw === '' ? undefined : Number(raw);
    this.draft.update((d) => ({ ...d, [key]: { ...d[key], [side]: value } }));
  }
}
