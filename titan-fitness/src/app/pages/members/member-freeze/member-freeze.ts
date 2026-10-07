import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { addMonths, initials, toIso } from '../../../services/helpers';
import { Member, MemberService } from '../../../services/member.service';
import { PopupService } from '../../../services/popup.service';
import { StatusBadge } from '../../../sharedComponent/status-badge/status-badge';

@Component({
  selector: 'app-member-freeze',
  imports: [FormsModule, RouterLink, DatePipe, StatusBadge],
  templateUrl: './member-freeze.html',
})
export class MemberFreeze {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private svc = inject(MemberService);
  private popup = inject(PopupService);

  member = signal<Member | undefined>(undefined);
  loading = signal(true);
  initials = initials;

  durations = [1, 2, 3];
  reasons = ['Extended Travel', 'Medical', 'Injury', 'Financial', 'Other'];

  startDate = signal(this.tomorrow());
  months = signal(1);
  reason = signal('');
  notes = signal('');

  blocked = computed(() => {
    const m = this.member();
    if (!m) return '';
    if (m.status !== 'Active') return `This membership is ${m.status}.`;
    if (m.freezesUsed >= m.freezesMax) return 'No freezes remaining on this plan.';
    return '';
  });

  startError = computed(() => {
    const s = this.startDate();
    const m = this.member();
    if (!s) return 'Start date is required.';
    if (s < toIso(new Date())) return 'Start date cannot be in the past.';
    if (m && s >= m.endDate) return 'Must be before the current end date.';
    return '';
  });

  newEndDate = computed(() => {
    const m = this.member();
    if (!m || this.startError()) return null;
    return addMonths(m.endDate, this.months());
  });

  valid = computed(
    () => !!this.member() && !this.blocked() && !this.startError() && !!this.reason(),
  );

  constructor() {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    this.svc.getById(id).subscribe({
      next: (m) => {
        this.member.set(m);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  private tomorrow() {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return toIso(d);
  }

  confirm() {
    const m = this.member();
    const end = this.newEndDate();
    if (!m || !end || !this.valid()) return;

    this.svc
      .update(m.id, {
        status: 'Frozen',
        endDate: toIso(end),
        freezesUsed: m.freezesUsed + 1,
      })
      .subscribe(() => {
        this.popup.toast(`${m.name}'s membership is frozen`);
        this.router.navigate(['/members', m.id]);
      });
  }

  cancel() {
    const m = this.member();
    this.router.navigate(m ? ['/members', m.id] : ['/members']);
  }
}
