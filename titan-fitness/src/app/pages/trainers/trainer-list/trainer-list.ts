import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { ActivatedRoute, ParamMap, Router, RouterLink } from '@angular/router';
import { BranchService } from '../../../services/branch.service';
import { matches, SearchService } from '../../../services/search.service';
import { Trainer, TrainerService } from '../../../services/trainer.service';
import {
  Column,
  DynamicTable,
  rowText,
} from '../../../sharedComponent/dynamic-table/dynamic-table';
import { FilterConfig, FilterDialog } from '../../../sharedComponent/filter-dialog/filter-dialog';
import { Paginator } from '../../../sharedComponent/paginator/paginator';

interface ListState {
  page: number;
  sortKey: string;
  sortDir: 'asc' | 'desc';
  branch: string[];
  specialty: string[];
  status: string[];
}

const memory: { value: ListState | null } = { value: null };

function initialState(q: ParamMap): ListState {
  if (!q.keys.length && memory.value) return memory.value;
  const list = (k: string) => q.get(k)?.split(',').filter(Boolean) ?? [];
  return {
    page: Number(q.get('page')) || 1,
    sortKey: q.get('sort') ?? 'name',
    sortDir: q.get('dir') === 'desc' ? 'desc' : 'asc',
    branch: list('branch'),
    specialty: list('specialty'),
    status: list('status'),
  };
}

@Component({
  selector: 'app-trainer-list',
  imports: [RouterLink, DynamicTable, Paginator, FilterDialog],
  templateUrl: './trainer-list.html',
})
export class TrainerList {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private branches = inject(BranchService);
  private search = inject(SearchService);
  svc = inject(TrainerService);

  pageSize = 5;
  filterOpen = signal(false);
  state = signal<ListState>(initialState(this.route.snapshot.queryParamMap));
  private lastTerm = this.search.term();

  columns: Column[] = [
    { key: 'name', label: 'Trainer Name', type: 'name', sortable: true },
    { key: 'id', label: 'ID', sortable: true, hide: 'sm', value: (r) => '#' + r.id },
    { key: 'specialty', label: 'Specialty', sortable: true, hide: 'md' },
    { key: 'branch', label: 'Branch', sortable: true, hide: 'md' },
    {
      key: 'isActive',
      label: 'Status',
      type: 'badge',
      sortable: true,
      value: (r) => (r.isActive ? 'Active' : 'Inactive'),
    },
  ];

  result = computed(() => {
    const { branch, specialty, status, sortKey, sortDir, page } = this.state();
    const term = this.search.term();
    return this.svc.query({
      filter: (t) =>
        (!branch.length || branch.includes(t.branch)) &&
        (!specialty.length || specialty.includes(t.specialty)) &&
        (!status.length || status.includes(t.isActive ? 'Active' : 'Inactive')) &&
        matches(rowText(this.columns, t), term),
      sortKey,
      sortDir,
      page,
      pageSize: this.pageSize,
    });
  });

  rows = computed(() => this.result().rows);
  total = computed(() => this.result().total);

  filterConfig = computed<FilterConfig[]>(() => [
    { key: 'branch', label: 'Branch', type: 'multi', options: this.branches.names() },
    {
      key: 'specialty',
      label: 'Specialty',
      type: 'multi',
      options: [
        ...new Set(
          this.svc
            .items()
            .map((t) => t.specialty)
            .filter(Boolean),
        ),
      ].sort(),
    },
    { key: 'status', label: 'Status', type: 'checks', options: ['Active', 'Inactive'] },
  ]);

  filterValue = computed(() => {
    const { branch, specialty, status } = this.state();
    return { branch, specialty, status };
  });

  activeCount = computed(() => {
    const { branch, specialty, status } = this.state();
    return [branch, specialty, status].filter((g) => g.length).length;
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
          branch: s.branch.join(',') || null,
          specialty: s.specialty.join(',') || null,
          status: s.status.join(',') || null,
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
      branch: v['branch'] ?? [],
      specialty: v['specialty'] ?? [],
      status: v['status'] ?? [],
      page: 1,
    });
    this.filterOpen.set(false);
  }

  view(t: Trainer) {
    this.router.navigate(['/trainers', t.id]);
  }

  edit(t: Trainer) {
    this.router.navigate(['/trainers', t.id, 'edit']);
  }
}
