import { Component, inject, input, output, signal } from '@angular/core';
import { SearchService } from '../../services/search.service';
import { ClickOutside } from '../directives/click-outside';
import { Highlight } from '../pipes/highlight-pipe';
import { StatusBadge } from '../status-badge/status-badge';

export interface Column {
  key: string;
  label: string;
  type?: 'text' | 'name' | 'link' | 'badge';
  sortable?: boolean;
  hide?: 'sm' | 'md' | 'lg';
  value?: (row: any) => string;
}

export function rowText(columns: Column[], row: any) {
  return columns.map((c) => (c.value ? c.value(row) : String(row[c.key] ?? ''))).join(' ');
}

@Component({
  selector: 'app-dynamic-table',
  imports: [StatusBadge, ClickOutside, Highlight],
  templateUrl: './dynamic-table.html',
})
export class DynamicTable {
  search = inject(SearchService);

  columns = input.required<Column[]>();
  rows = input.required<any[]>();
  idKey = input('id');
  sortKey = input('');
  sortDir = input<'asc' | 'desc'>('asc');
  viewLabel = input('View');
  editLabel = input('Update');

  sortChange = output<string>();
  view = output<any>();
  edit = output<any>();

  openId = signal<string | null>(null);

  text(row: any, c: Column): string {
    return c.value ? c.value(row) : String(row[c.key] ?? '');
  }

  hideClass(c: Column) {
    return c.hide ? `d-none d-${c.hide}-table-cell` : '';
  }

  initials(name: string) {
    return name
      .split(' ')
      .map((p) => p[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }

  toggle(id: string) {
    this.openId.update((v) => (v === id ? null : id));
  }

  close() {
    this.openId.set(null);
  }

  pick(kind: 'view' | 'edit', row: any) {
    this.close();
    if (kind === 'view') {
      this.view.emit(row);
    } else {
      this.edit.emit(row);
    }
  }
}
