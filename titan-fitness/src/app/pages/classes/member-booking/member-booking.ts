import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ClassService } from '../../../services/class.service';
import { timeParts, toIso } from '../../../services/helpers';
import { MemberService } from '../../../services/member.service';
import { PopupService } from '../../../services/popup.service';
import { endTime, fillPercent, stateOf } from '../classes.data';

@Component({
  selector: 'app-member-booking',
  imports: [FormsModule, RouterLink, DatePipe],
  templateUrl: './member-booking.html',
})
export class MemberBooking {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private popup = inject(PopupService);
  private classes = inject(ClassService);
  private members = inject(MemberService);

  private id = this.route.snapshot.paramMap.get('id') ?? '';
  private memberId = 'TF-8492';

  loading = signal(true);
  booked = signal(false);
  notes = signal('');

  cls = computed(() => this.classes.items().find((c) => String(c.id) === this.id));
  member = computed(() => this.members.items().find((m) => m.id === this.memberId));

  percent = computed(() => {
    const c = this.cls();
    return c ? fillPercent(c) : 0;
  });

  spotsLeft = computed(() => {
    const c = this.cls();
    return c ? Math.max(0, c.capacity - c.enrolled) : 0;
  });

  when = computed(() => {
    const c = this.cls();
    if (!c) return '';
    const s = timeParts(c.startTime);
    const e = timeParts(endTime(c));
    const day = c.date === toIso(new Date()) ? 'Today' : this.datePipe.transform(c.date, 'MMM d');
    return `${day}, ${s.time} ${s.period} - ${e.time} ${e.period}`;
  });

  problem = computed(() => {
    const m = this.member();
    const c = this.cls();
    if (!m || !c) return '';
    if (m.status !== 'Active') return `Your membership is ${m.status.toLowerCase()}.`;
    const s = stateOf(c);
    if (s === 'full') return 'This class is full.';
    if (s === 'completed') return 'This class has already finished.';
    if (s === 'cancelled') return 'This class was cancelled.';
    return '';
  });

  private datePipe = new DatePipe('en-US');

  constructor() {
    this.members.load().subscribe({ error: () => {} });
    this.classes.load().subscribe({
      next: () => this.loading.set(false),
      error: () => this.loading.set(false),
    });
  }

  confirm() {
    const c = this.cls();
    if (!c || this.problem()) return;

    this.classes.update(c.id, { enrolled: c.enrolled + 1 }).subscribe(() => {
      this.booked.set(true);
      this.popup.toast(`You are booked into ${c.name}`);
    });
  }

  back() {
    this.router.navigate(['/classes']);
  }
}
