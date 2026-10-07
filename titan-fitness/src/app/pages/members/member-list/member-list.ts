import { DatePipe } from '@angular/common';
import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { BranchService } from '../../../services/branch.service';
import { DialogService } from '../../../services/dialog.service';
import { initials, toIso } from '../../../services/helpers';
import { Member, MemberService } from '../../../services/member.service';
import { matches, SearchService } from '../../../services/search.service';
import { ClickOutside } from '../../../sharedComponent/directives/click-outside';
import { FilterConfig, FilterDialog } from '../../../sharedComponent/filter-dialog/filter-dialog';
import { Paginator } from '../../../sharedComponent/paginator/paginator';
import { Highlight } from '../../../sharedComponent/pipes/highlight-pipe';
import { StatusBadge } from '../../../sharedComponent/status-badge/status-badge';

interface ListState {
  page: number;
  branch: string[];
  status: string[];
}

const memory: { value: ListState | null } = { value: null };

function initialState(q: ParamMap): ListState {
  if (!q.keys.length && memory.value) return memory.value;
  const list = (k: string) => q.get(k)?.split(',').filter(Boolean) ?? [];
  return {
    page: Number(q.get('page')) || 1,
    branch: list('branch'),
    status: list('status'),
  };
}

@Component({
  selector: 'app-member-list',
  imports: [StatusBadge, Paginator, ClickOutside, Highlight, FilterDialog],
  templateUrl: './member-list.html',
})
export class MemberList {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private dialog = inject(DialogService);
  private branches = inject(BranchService);
  private datePipe = new DatePipe('en-US');
  svc = inject(MemberService);
  search = inject(SearchService);

  pageSize = 5;
  openId = signal<string | null>(null);
  filterOpen = signal(false);
  state = signal<ListState>(initialState(this.route.snapshot.queryParamMap));
  private lastTerm = this.search.term();

  result = computed(() => {
    const { branch, status, page } = this.state();
    const term = this.search.term();
    return this.svc.query({
      filter: (m) =>
        (!branch.length || branch.includes(m.branch)) &&
        (!status.length || status.includes(m.status)) &&
        matches([m.name, '#' + m.id, m.status, m.branch].join(' '), term),
      page,
      pageSize: this.pageSize,
    });
  });
  rows = computed(() => this.result().rows);
  total = computed(() => this.result().total);

  filterConfig = computed<FilterConfig[]>(() => [
    { key: 'branch', label: 'Branch', type: 'multi', options: this.branches.names() },
    { key: 'status', label: 'Status', type: 'checks', options: ['Active', 'Frozen', 'Expired'] },
  ]);

  filterValue = computed(() => {
    const { branch, status } = this.state();
    return { branch, status };
  });

  activeCount = computed(() => {
    const { branch, status } = this.state();
    return [branch, status].filter((g) => g.length).length;
  });

  initials = initials;

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
          branch: s.branch.join(',') || null,
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

  apply(v: Record<string, any>) {
    this.set({ branch: v['branch'] ?? [], status: v['status'] ?? [], page: 1 });
    this.filterOpen.set(false);
  }

  visit(iso: string) {
    if (!iso) return '—';
    if (iso.slice(0, 10) === toIso(new Date())) {
      return 'Today, ' + this.datePipe.transform(iso, 'h:mm a');
    }
    return this.datePipe.transform(iso, 'MMM d, y, h:mm a') ?? '—';
  }

  toggleMenu(id: string) {
    this.openId.update((v) => (v === id ? null : id));
  }

  closeMenu() {
    this.openId.set(null);
  }

  canCheckIn(m: Member) {
    return m.status === 'Active';
  }

  canFreeze(m: Member) {
    return m.status === 'Active' && m.freezesUsed < m.freezesMax;
  }

  freezeHint(m: Member) {
    if (m.status !== 'Active') return `Membership is ${m.status}`;
    return 'No freezes remaining';
  }

  add() {
    this.dialog.addMember();
  }

  view(m: Member) {
    this.closeMenu();
    this.router.navigate(['/members', m.id]);
  }

  checkIn(m: Member) {
    this.closeMenu();
    this.dialog.checkIn(m);
  }

  freeze(m: Member) {
    this.closeMenu();
    this.router.navigate(['/members', m.id, 'freeze']);
  }
}
