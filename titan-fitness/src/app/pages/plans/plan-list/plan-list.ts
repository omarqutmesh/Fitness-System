import { CurrencyPipe } from '@angular/common';
import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { ActivatedRoute, ParamMap, Router, RouterLink } from '@angular/router';
import { durationLabel, Plan, PlanService } from '../../../services/plan.service';
import { matches, SearchService } from '../../../services/search.service';
import {
  Column,
  DynamicTable,
  rowText,
} from '../../../sharedComponent/dynamic-table/dynamic-table';
import { FilterConfig, FilterDialog } from '../../../sharedComponent/filter-dialog/filter-dialog';
import { Paginator } from '../../../sharedComponent/paginator/paginator';
import { FreezeAllowance } from '../../../sharedComponent/pipes/freeze-allowance-pipe';
interface ListState {
  page: number;
  sortKey: string;
  sortDir: 'asc' | 'desc';
  duration: string[];
  access: string;
  status: string[];
  min: number | null;
  max: number | null;
}

const memory: { value: ListState | null } = { value: null };

function initialState(q: ParamMap): ListState {
  if (!q.keys.length && memory.value) return memory.value;
  const list = (k: string) => q.get(k)?.split(',').filter(Boolean) ?? [];
  const num = (k: string) => (q.get(k) ? Number(q.get(k)) : null);
  return {
    page: Number(q.get('page')) || 1,
    sortKey: q.get('sort') ?? 'name',
    sortDir: q.get('dir') === 'desc' ? 'desc' : 'asc',
    duration: list('duration'),
    access: q.get('access') ?? 'Any',
    status: list('status'),
    min: num('min'),
    max: num('max'),
  };
}

@Component({
  selector: 'app-plan-list',
  imports: [RouterLink, DynamicTable, Paginator, FilterDialog],
  templateUrl: './plan-list.html',
})
export class PlanList {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private search = inject(SearchService);
  private currency = new CurrencyPipe('en-US');
  private freeze = new FreezeAllowance();
  svc = inject(PlanService);

  pageSize = 5;
  filterOpen = signal(false);
  state = signal<ListState>(initialState(this.route.snapshot.queryParamMap));
  private lastTerm = this.search.term();

  columns: Column[] = [
    { key: 'name', label: 'Plan Name', type: 'link', sortable: true },
    {
      key: 'price',
      label: 'Price',
      sortable: true,
      value: (r) => this.currency.transform(r.price, 'USD') ?? '',
    },
    {
      key: 'duration',
      label: 'Duration',
      sortable: true,
      hide: 'sm',
      value: (r) => durationLabel(r.duration),
    },
    {
      key: 'freezeDays',
      label: 'Freeze Allowance',
      hide: 'lg',
      value: (r) => this.freeze.transform(r.freezeDays, r.maxFreezes),
    },
    { key: 'guestPasses', label: 'Guest Passes', sortable: true, hide: 'lg' },
    { key: 'access', label: 'Access', sortable: true, hide: 'md' },
    {
      key: 'isPublished',
      label: 'Status',
      type: 'badge',
      sortable: true,
      value: (r) => (r.isPublished ? 'Published' : 'Retired'),
    },
  ];

  result = computed(() => {
    const { duration, access, status, min, max, sortKey, sortDir, page } = this.state();
    const term = this.search.term();
    return this.svc.query({
      filter: (p) =>
        (!duration.length || duration.includes(durationLabel(p.duration))) &&
        (access === 'Any' || p.access === access) &&
        (!status.length || status.includes(p.isPublished ? 'Published' : 'Retired')) &&
        (min === null || p.price >= min) &&
        (max === null || p.price <= max) &&
        matches(rowText(this.columns, p), term),
      sortKey,
      sortDir,
      page,
      pageSize: this.pageSize,
    });
  });

  rows = computed(() => this.result().rows);
  total = computed(() => this.result().total);

  filterConfig = computed<FilterConfig[]>(() => {
    const items = this.svc.items();
    const prices = items.map((p) => p.price);
    const durations = [...new Set(items.map((p) => p.duration))].sort((a, b) => a - b);
    return [
      { key: 'duration', label: 'Duration', type: 'multi', options: durations.map(durationLabel) },
      {
        key: 'access',
        label: 'Access',
        type: 'radio',
        options: ['Any', 'All branches', 'Home branch only'],
      },
      {
        key: 'price',
        label: 'Price range (USD)',
        type: 'range',
        options: [],
        min: prices.length ? Math.min(...prices) : 0,
        max: prices.length ? Math.max(...prices) : 0,
      },
      { key: 'status', label: 'Status', type: 'checks', options: ['Published', 'Retired'] },
    ];
  });

  filterValue = computed(() => {
    const { duration, access, status, min, max } = this.state();
    return { duration, access, status, price: { min: min ?? undefined, max: max ?? undefined } };
  });

  activeCount = computed(() => {
    const { duration, access, status, min, max } = this.state();
    return [
      duration.length > 0,
      access !== 'Any',
      status.length > 0,
      min !== null || max !== null,
    ].filter(Boolean).length;
  });

  constructor() {
    this.load();

    effect(() => {
      const t = this.search.term();
      if (t !== this.lastTerm) {
        this.lastTerm = t;
        untracked(() => this.set({ page: 1 }));
      }
    });

    effect(() => {
      const s = this.state();
      memory.value = s;
      this.router.navigate([], {
        relativeTo: this.route,
        replaceUrl: true,
        queryParams: {
          page: s.page > 1 ? s.page : null,
          sort: s.sortKey,
          dir: s.sortDir,
          duration: s.duration.join(',') || null,
          access: s.access !== 'Any' ? s.access : null,
          status: s.status.join(',') || null,
          min: s.min,
          max: s.max,
        },
      });
    });
  }

  load() {
    this.svc.load().subscribe({ error: () => {} });
  }

  set(patch: Partial<ListState>) {
    this.state.update((s) => ({ ...s, ...patch }));
  }

  sort(key: string) {
    const s = this.state();
    const dir = s.sortKey === key && s.sortDir === 'asc' ? 'desc' : 'asc';
    this.set({ sortKey: key, sortDir: dir, page: 1 });
  }

  apply(v: Record<string, any>) {
    this.set({
      duration: v['duration'] ?? [],
      access: v['access'] ?? 'Any',
      status: v['status'] ?? [],
      min: v['price']?.min ?? null,
      max: v['price']?.max ?? null,
      page: 1,
    });
    this.filterOpen.set(false);
  }

  view(p: Plan) {
    this.router.navigate(['/plans', p.id]);
  }

  edit(p: Plan) {
    this.router.navigate(['/plans', p.id, 'edit']);
  }
}
