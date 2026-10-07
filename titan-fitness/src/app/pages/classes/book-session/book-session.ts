import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ClassService } from '../../../services/class.service';
import { initials } from '../../../services/helpers';
import { Member, MemberService } from '../../../services/member.service';
import { PopupService } from '../../../services/popup.service';
import { Highlight } from '../../../sharedComponent/pipes/highlight-pipe';
import { StatusBadge } from '../../../sharedComponent/status-badge/status-badge';
import { endTime, GymClass, stateOf } from '../classes.data';

@Component({
  selector: 'app-book-session',
  imports: [FormsModule, RouterLink, StatusBadge, Highlight],
  templateUrl: './book-session.html',
})
export class BookSession {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private popup = inject(PopupService);
  private classes = inject(ClassService);
  private members = inject(MemberService);

  cls = signal<GymClass | undefined>(undefined);
  loading = signal(true);
  initials = initials;
  endTime = endTime;

  term = signal('');
  selected = signal<Member | null>(null);
  notes = signal('');

  closedReason = computed(() => {
    const c = this.cls();
    if (!c) return '';
    const s = stateOf(c);
    if (s === 'full') return 'This class is full.';
    if (s === 'completed') return 'This class has already finished.';
    if (s === 'cancelled') return 'This class was cancelled.';
    return '';
  });

  results = computed(() => {
    const t = this.term().trim().toLowerCase();
    return this.members
      .items()
      .filter(
        (m) =>
          m.status === 'Active' &&
          (!t || m.name.toLowerCase().includes(t) || m.id.toLowerCase().includes(t)),
      )
      .slice(0, 4);
  });

  constructor() {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    this.members.load().subscribe({ error: () => {} });
    this.classes.getById(id).subscribe({
      next: (c) => {
        this.cls.set(c);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  confirm() {
    const c = this.cls();
    const m = this.selected();
    if (!c || !m || this.closedReason()) return;

    this.classes.update(c.id, { enrolled: c.enrolled + 1 }).subscribe(() => {
      this.popup.toast(`${m.name} booked into ${c.name}`);
      this.router.navigate(['/classes']);
    });
  }

  cancel() {
    this.router.navigate(['/classes']);
  }
}
