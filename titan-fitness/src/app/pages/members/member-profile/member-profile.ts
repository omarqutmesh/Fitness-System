import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CheckInService } from '../../../services/checkin.service';
import { DialogService } from '../../../services/dialog.service';
import { initials, timeParts, toIso } from '../../../services/helpers';
import { MemberService } from '../../../services/member.service';
import { StatusBadge } from '../../../sharedComponent/status-badge/status-badge';

@Component({
  selector: 'app-member-profile',
  imports: [RouterLink, DatePipe, CurrencyPipe, StatusBadge],
  templateUrl: './member-profile.html',
})
export class MemberProfile {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private checkins = inject(CheckInService);
  private members = inject(MemberService);
  private datePipe = new DatePipe('en-US');
  dialog = inject(DialogService);

  private id = this.route.snapshot.paramMap.get('id') ?? '';

  loading = signal(true);
  initials = initials;

  member = computed(() => this.members.items().find((x) => x.id === this.id));

  activity = computed(() => {
    const m = this.member();
    if (!m) return [];
    const today = toIso(new Date());
    return this.checkins
      .items()
      .filter((c) => c.memberId === m.id)
      .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time))
      .slice(0, 3)
      .map((c) => {
        const t = timeParts(c.time);
        return {
          icon: 'bi-box-arrow-in-right',
          title: 'Facility Check-in',
          sub: `${c.branch} Branch`,
          when: c.date === today ? 'Today' : this.datePipe.transform(c.date, 'MMM d, y'),
          time: `${t.time} ${t.period}`,
        };
      });
  });

  constructor() {
    this.checkins.load().subscribe({ error: () => {} });
    this.members.load().subscribe({
      next: () => this.loading.set(false),
      error: () => this.loading.set(false),
    });
  }

  percent(used: number, max: number) {
    return max === 0 ? 0 : Math.round((used / max) * 100);
  }

  back() {
    this.router.navigate(['/members']);
  }
}
