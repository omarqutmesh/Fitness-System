import { Component, computed, inject, viewChild } from '@angular/core';
import { BranchService } from '../../../services/branch.service';
import { DialogService } from '../../../services/dialog.service';
import { toIso } from '../../../services/helpers';
import { MemberService } from '../../../services/member.service';
import { PopupService } from '../../../services/popup.service';
import { DynamicForm, FieldConfig } from '../../dynamic-form/dynamic-form';
import { Modal } from '../../modal/modal';
import { StatusBadge } from '../../status-badge/status-badge';

@Component({
  selector: 'app-member-dialog',
  imports: [Modal, DynamicForm, StatusBadge],
  templateUrl: './member-dialog.html',
})
export class MemberDialog {
  private dialog = inject(DialogService);
  private svc = inject(MemberService);
  private popup = inject(PopupService);
  private branches = inject(BranchService);

  form = viewChild(DynamicForm);

  member = computed(() => {
    const s = this.dialog.state();
    return s?.kind === 'member' ? s.member : undefined;
  });

  isEdit = computed(() => !!this.member());
  title = computed(() => (this.isEdit() ? 'Edit Member' : 'Add Member'));

  values = computed(() => {
    const m = this.member();
    return m ? { name: m.name, branch: m.branch } : { branch: this.branches.current() };
  });

  fields = computed<FieldConfig[]>(() => [
    {
      key: 'name',
      label: 'Member name',
      type: 'text',
      required: true,
      full: true,
      minLength: 2,
      maxLength: 80,
      placeholder: 'e.g., Jane Doe',
      pattern: /^[A-Za-z\u00C0-\u024F\u0600-\u06FF' -]+$/,
      patternMessage: 'Letters, spaces, hyphens and apostrophes only.',
    },
    {
      key: 'branch',
      label: 'Branch',
      type: 'select',
      required: true,
      full: true,
      options: this.branches.names(),
      placeholder: 'Select a branch',
    },
  ]);

  close() {
    this.dialog.close();
  }

  async cancel() {
    if (this.form()?.dirty()) {
      const ok = await this.popup.confirm(
        'Discard changes?',
        'Your changes will be lost.',
        'Discard',
      );
      if (!ok) return;
    }
    this.close();
  }

  save() {
    const v = this.form()?.submit();
    if (!v) return;

    const name = v['name'] as string;
    const branch = v['branch'] as string;
    const m = this.member();

    if (m) {
      this.svc.update(m.id, { name, branch }).subscribe(() => {
        this.popup.toast('Member updated');
        this.close();
      });
      return;
    }

    const today = toIso(new Date());
    this.svc
      .create({
        name,
        branch,
        status: 'Active',
        lastVisit: '',
        email: '',
        phone: '',
        address: '',
        joined: today,
        plan: '—',
        price: 0,
        endDate: today,
        freezesUsed: 0,
        freezesMax: 0,
        guestUsed: 0,
        guestMax: 0,
      })
      .subscribe((created) => {
        this.popup.toast(`${created.name} added as #${created.id}`);
        this.close();
      });
  }
}
