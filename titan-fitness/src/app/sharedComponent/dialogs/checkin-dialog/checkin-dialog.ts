import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BranchService } from '../../../services/branch.service';
import { CheckInService } from '../../../services/checkin.service';
import { DialogService } from '../../../services/dialog.service';
import { addDays, initials, timeParts, toIso } from '../../../services/helpers';
import { Member, MemberService } from '../../../services/member.service';
import { PopupService } from '../../../services/popup.service';
import { Autofocus } from '../../directives/autofocus';
import { Modal } from '../../modal/modal';
import { StatusBadge } from '../../status-badge/status-badge';

function nowRounded() {
  const d = new Date();
  d.setMinutes(Math.floor(d.getMinutes() / 5) * 5, 0, 0);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

@Component({
  selector: 'app-checkin-dialog',
  imports: [Modal, FormsModule, StatusBadge, Autofocus],
  templateUrl: './checkin-dialog.html',
})
export class CheckinDialog {
  private dialog = inject(DialogService);
  private members = inject(MemberService);
  private checkins = inject(CheckInService);
  private popup = inject(PopupService);
  branch = inject(BranchService);

  initials = initials;
  today = toIso(new Date());
  minDate = addDays(this.today, -7);

  locked = computed(() => {
    const s = this.dialog.state();
    return s?.kind === 'checkin' ? s.member : undefined;
  });

  term = signal('');
  selected = signal<Member | null>(this.locked() ?? null);
  date = signal(this.today);
  time = signal(nowRounded());
  notes = signal('');
  touched = signal(false);

  results = computed(() => {
    const t = this.term().trim().toLowerCase();
    if (!t || this.selected()) return [];
    return this.members
      .items()
      .filter(
        (m) => m.name.toLowerCase().includes(t) || m.id.toLowerCase().includes(t.replace('#', '')),
      )
      .slice(0, 5);
  });

  memberError = computed(() => {
    const m = this.selected();
    if (!m) return 'Select a member.';
    if (m.status !== 'Active') return `Membership is ${m.status}.`;
    return '';
  });

  dateError = computed(() => {
    const d = this.date();
    if (!d) return 'Date is required.';
    if (d > this.today) return 'Date cannot be in the future.';
    if (d < this.minDate) return 'Date cannot be older than 7 days.';
    return '';
  });

  timeError = computed(() => {
    const t = this.time();
    if (!t) return 'Time is required.';
    if (this.date() && new Date(`${this.date()}T${t}:00`) > new Date())
      return 'Time cannot be in the future.';
    return '';
  });

  valid = computed(() => !this.memberError() && !this.dateError() && !this.timeError());

  constructor() {
    this.members.load().subscribe({ error: () => {} });
    this.checkins.load().subscribe({ error: () => {} });
  }

  pick(m: Member) {
    this.selected.set(m);
    this.term.set('');
  }

  clearPick() {
    if (!this.locked()) this.selected.set(null);
  }

  close() {
    this.dialog.close();
  }

  save() {
    this.touched.set(true);
    const m = this.selected();
    if (!this.valid() || !m) return;

    const date = this.date();
    const time = this.time();

    this.checkins
      .create({
        memberId: m.id,
        memberName: m.name,
        branch: this.branch.current(),
        date,
        time,
        notes: this.notes().trim(),
      })
      .subscribe(() => {
        this.members.update(m.id, { lastVisit: `${date}T${time}:00` }).subscribe(() => {
          const t = timeParts(time);
          this.popup.toast(`${m.name} checked in at ${t.time} ${t.period}`);
          this.close();
        });
      });
  }
}
