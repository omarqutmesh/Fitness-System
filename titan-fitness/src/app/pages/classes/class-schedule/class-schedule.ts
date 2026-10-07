import { DatePipe } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { BranchService } from '../../../services/branch.service';
import { ClassService } from '../../../services/class.service';
import { DialogService } from '../../../services/dialog.service';
import { addDays, timeParts, toIso } from '../../../services/helpers';
import { PopupService } from '../../../services/popup.service';
import { matches, SearchService } from '../../../services/search.service';
import { ClickOutside } from '../../../sharedComponent/directives/click-outside';
import { Highlight } from '../../../sharedComponent/pipes/highlight-pipe';
import { endTime, fillPercent, GymClass, STATE_LABEL, stateOf } from '../classes.data';

@Component({
  selector: 'app-class-schedule',
  imports: [FormsModule, DatePipe, ClickOutside, Highlight],
  templateUrl: './class-schedule.html',
})
export class ClassSchedule {
  private router = inject(Router);
  private popup = inject(PopupService);
  private dialog = inject(DialogService);
  header = inject(BranchService);
  search = inject(SearchService);
  svc = inject(ClassService);

  branch = signal(this.header.current());
  date = signal(toIso(new Date()));
  view = signal<'day' | 'week'>('day');
  openId = signal<number | null>(null);

  today = toIso(new Date());
  labels = STATE_LABEL;
  stateOf = stateOf;
  parts = timeParts;
  endTime = endTime;
  percent = fillPercent;

  groups = computed(() => {
    if (this.svc.failed() || this.svc.loading()) return [];
    const count = this.view() === 'day' ? 1 : 7;
    const term = this.search.term();
    return Array.from({ length: count }, (_, i) => {
      const day = addDays(this.date(), i);
      const items = this.svc
        .items()
        .filter((c) => c.date === day && (this.branch() === 'All' || c.branch === this.branch()))
        .filter((c) => matches([c.name, c.trainer, c.studio].join(' '), term))
        .sort((a, b) => a.startTime.localeCompare(b.startTime));
      return { day, items };
    });
  });

  visible = computed(() => this.groups().flatMap((g) => g.items));

  totalBookings = computed(() => this.visible().reduce((sum, c) => sum + c.enrolled, 0));

  avgFill = computed(() => {
    const list = this.visible().filter((c) => !c.cancelled);
    if (!list.length) return 0;
    return Math.round(list.reduce((sum, c) => sum + fillPercent(c), 0) / list.length);
  });

  isToday = computed(() => this.date() === this.today);

  constructor() {
    this.load();
    effect(() => this.branch.set(this.header.current()));
  }

  load() {
    this.svc.load().subscribe({ error: () => {} });
  }

  shift(dir: number) {
    const step = this.view() === 'day' ? 1 : 7;
    this.date.set(addDays(this.date(), dir * step));
  }

  toggleMenu(id: number) {
    this.openId.update((v) => (v === id ? null : id));
  }

  closeMenu() {
    this.openId.set(null);
  }

  add() {
    this.dialog.openClass('add');
  }

  open(mode: 'view' | 'edit', c: GymClass) {
    this.closeMenu();
    this.dialog.openClass(mode, c);
  }

  canBook(c: GymClass) {
    const s = stateOf(c);
    return s === 'upcoming' || s === 'active';
  }

  bookHint(c: GymClass) {
    return 'Class is ' + STATE_LABEL[stateOf(c)].toLowerCase();
  }

  book(c: GymClass) {
    this.closeMenu();
    this.router.navigate(['/classes', c.id, 'book']);
  }

  async cancelClass(c: GymClass) {
    this.closeMenu();
    const ok = await this.popup.confirm(
      'Cancel this class?',
      `${c.name} will be marked as cancelled.`,
      'Cancel Class',
    );
    if (!ok) return;
    this.svc.update(c.id, { cancelled: true }).subscribe(() => this.popup.toast('Class cancelled'));
  }
}
