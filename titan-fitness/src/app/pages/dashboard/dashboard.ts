import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { BranchService } from '../../services/branch.service';
import { CheckInService } from '../../services/checkin.service';
import { ClassService } from '../../services/class.service';
import { DialogService } from '../../services/dialog.service';
import { addDays, timeParts, toIso } from '../../services/helpers';
import { MemberService } from '../../services/member.service';
import { matches, SearchService } from '../../services/search.service';
import { Highlight } from '../../sharedComponent/pipes/highlight-pipe';
import { STATE_LABEL, stateOf } from '../classes/classes.data';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, DecimalPipe, Highlight],
  templateUrl: './dashboard.html',
})
export class Dashboard {
  private branch = inject(BranchService);
  private members = inject(MemberService);
  private checkins = inject(CheckInService);
  private dialog = inject(DialogService);
  private router = inject(Router);
  classSvc = inject(ClassService);
  search = inject(SearchService);

  today = toIso(new Date());
  labels = STATE_LABEL;
  parts = timeParts;

  stateFilter = signal('all');
  stateOptions = [
    { value: 'all', label: 'All states' },
    { value: 'upcoming', label: 'Upcoming' },
    { value: 'active', label: 'In Progress' },
    { value: 'full', label: 'Full' },
  ];

  checkInsToday = computed(
    () =>
      this.checkins
        .items()
        .filter((c) => c.branch === this.branch.current() && c.date === this.today).length,
  );

  checkInsLastWeek = computed(() => {
    const day = addDays(this.today, -7);
    return this.checkins.items().filter((c) => c.branch === this.branch.current() && c.date === day)
      .length;
  });

  activeMembers = computed(
    () =>
      this.members
        .items()
        .filter((m) => m.branch === this.branch.current() && m.status === 'Active').length,
  );

  onFloor = computed(() => {
    const now = Date.now();
    return this.checkins.items().filter((c) => {
      if (c.branch !== this.branch.current() || c.date !== this.today) return false;
      const diff = now - new Date(`${c.date}T${c.time}:00`).getTime();
      return diff >= 0 && diff <= 2 * 3600000;
    }).length;
  });

  upcoming = computed(() => {
    const term = this.search.term();
    const filter = this.stateFilter();
    return this.classSvc
      .items()
      .filter((c) => c.branch === this.branch.current() && c.date === this.today)
      .filter((c) => matches([c.name, c.trainer, c.studio].join(' '), term))
      .map((c) => ({ c, state: stateOf(c) }))
      .filter((x) => x.state !== 'completed' && x.state !== 'cancelled')
      .filter((x) => filter === 'all' || x.state === filter)
      .sort((a, b) => a.c.startTime.localeCompare(b.c.startTime));
  });

  quickActions = [
    {
      icon: 'bi-person-plus',
      title: 'New Member',
      text: 'Start enrollment process',
      run: () => this.dialog.addMember(),
    },
    {
      icon: 'bi-box-arrow-in-right',
      title: 'Manual Check-in',
      text: 'Verify member entry',
      run: () => this.dialog.checkIn(),
    },
    {
      icon: 'bi-calendar-check',
      title: 'Register Class',
      text: 'Book member into session',
      run: () => this.router.navigate(['/classes']),
    },
  ];

  constructor() {
    this.load();
  }

  load() {
    this.members.load().subscribe({ error: () => {} });
    this.checkins.load().subscribe({ error: () => {} });
    this.classSvc.load().subscribe({ error: () => {} });
  }
}
