import { Component, computed, effect, inject, signal, viewChild } from '@angular/core';
import { ValidatorFn } from '@angular/forms';
import { DURATIONS, STATE_LABEL, STUDIOS, stateOf } from '../../../pages/classes/classes.data';
import { BranchService } from '../../../services/branch.service';
import { ClassService } from '../../../services/class.service';
import { DialogService } from '../../../services/dialog.service';
import { toIso } from '../../../services/helpers';
import { PopupService } from '../../../services/popup.service';
import { TrainerService } from '../../../services/trainer.service';
import { DynamicForm, FieldConfig, FormMode } from '../../dynamic-form/dynamic-form';
import { Modal } from '../../modal/modal';

function overlap(aStart: string, aDur: number, bStart: string, bDur: number) {
  const a = new Date(aStart).getTime();
  const b = new Date(bStart).getTime();
  return a < b + bDur * 60000 && b < a + aDur * 60000;
}

@Component({
  selector: 'app-class-dialog',
  imports: [Modal, DynamicForm],
  templateUrl: './class-dialog.html',
})
export class ClassDialog {
  private dialog = inject(DialogService);
  private svc = inject(ClassService);
  private popup = inject(PopupService);
  private branches = inject(BranchService);
  private trainers = inject(TrainerService);

  private initial = this.dialog.state();

  form = viewChild(DynamicForm);

  mode = signal<FormMode>(this.initial?.kind === 'class' ? this.initial.mode : 'add');
  branch = signal(
    this.initial?.kind === 'class' && this.initial.cls
      ? this.initial.cls.branch
      : this.branches.current(),
  );
  labels = STATE_LABEL;

  cls = computed(() => {
    const s = this.dialog.state();
    return s?.kind === 'class' ? s.cls : undefined;
  });

  hasBookings = computed(() => (this.cls()?.enrolled ?? 0) > 0);
  state = computed(() => (this.cls() ? stateOf(this.cls()!) : null));
  lock = computed(() => (this.mode() === 'edit' && this.hasBookings() ? ['branch'] : []));

  title = computed(
    () => ({ add: 'Add New Class', view: 'Class Details', edit: 'Edit Class' })[this.mode()],
  );

  values = computed(() => {
    const c = this.cls();
    if (!c) return { branch: this.branches.current(), duration: '45 min' };
    return {
      name: c.name,
      branch: c.branch,
      trainer: c.trainer,
      studio: c.studio,
      date: c.date,
      startTime: c.startTime,
      capacity: c.capacity,
      duration: `${c.duration} min`,
      description: c.description ?? '',
    };
  });

  private overlapping =
    (field: 'trainer' | 'studio'): ValidatorFn =>
    (c) => {
      const value = c.value;
      const g = c.parent;
      if (!value || !g) return null;
      const date = g.get('date')?.value;
      const time = g.get('startTime')?.value;
      if (!date || !time) return null;

      const start = `${date}T${time}:00`;
      const dur = parseInt(g.get('duration')?.value || '45', 10);
      const self = this.cls()?.id;

      const clash = this.svc
        .items()
        .some(
          (x) =>
            x.id !== self &&
            !x.cancelled &&
            x[field] === value &&
            overlap(start, dur, `${x.date}T${x.startTime}:00`, x.duration),
        );
      if (!clash) return null;
      return {
        custom:
          field === 'trainer'
            ? 'This trainer has an overlapping class.'
            : 'This room is booked for an overlapping slot.',
      };
    };

  private notPast: ValidatorFn = (c) =>
    c.value && c.value < toIso(new Date()) ? { custom: 'Date must be today or later.' } : null;

  private timeFuture: ValidatorFn = (c) => {
    const date = c.parent?.get('date')?.value;
    if (!c.value || date !== toIso(new Date())) return null;
    return new Date(`${date}T${c.value}:00`) <= new Date()
      ? { custom: 'Time must be later than now.' }
      : null;
  };

  private capacityOk: ValidatorFn = (c) => {
    if (c.value === '' || c.value === null) return null;
    const enrolled = this.cls()?.enrolled ?? 0;
    return Number(c.value) < enrolled
      ? { custom: `Not below current enrolment (${enrolled}).` }
      : null;
  };

  fields = computed<FieldConfig[]>(() => {
    const b = this.branch();
    const trainerOptions = this.trainers
      .items()
      .filter((t) => t.isActive && t.branch === b)
      .map((t) => t.name);
    const studioOptions = STUDIOS[b] ?? [];
    const slot = ['date', 'startTime', 'duration'];

    return [
      {
        key: 'name',
        label: 'Class Name',
        type: 'text',
        required: true,
        minLength: 3,
        maxLength: 80,
        placeholder: 'e.g., High-Intensity Interval Training',
      },
      {
        key: 'branch',
        label: 'Branch',
        type: 'select',
        required: true,
        options: this.branches.names(),
        placeholder: 'Select a branch',
      },
      {
        key: 'trainer',
        label: 'Trainer / Instructor',
        type: 'select',
        options: trainerOptions,
        placeholder: 'Select an instructor',
        validators: [this.overlapping('trainer')],
        dependsOn: slot,
      },
      {
        key: 'studio',
        label: 'Studio / Room',
        type: 'select',
        options: studioOptions,
        placeholder: 'Assign a room',
        validators: [this.overlapping('studio')],
        dependsOn: slot,
      },
      {
        key: 'date',
        label: 'Date',
        type: 'date',
        width: 'third',
        required: true,
        validators: [this.notPast],
      },
      {
        key: 'startTime',
        label: 'Start Time',
        type: 'time',
        width: 'third',
        required: true,
        validators: [this.timeFuture],
        dependsOn: 'date',
      },
      {
        key: 'capacity',
        label: 'Capacity Limit (spots)',
        type: 'number',
        width: 'third',
        integer: true,
        min: 1,
        max: 100,
        placeholder: '20',
        validators: [this.capacityOk],
      },
      { key: 'duration', label: 'Duration', type: 'radio', options: DURATIONS },
      {
        key: 'description',
        label: 'Description (Optional)',
        type: 'textarea',
        full: true,
        maxLength: 500,
        placeholder: 'Add details about the class focus, required equipment, or intensity level...',
      },
    ];
  });

  constructor() {
    this.trainers.load().subscribe({ error: () => {} });
    this.svc.load().subscribe({ error: () => {} });

    effect((onCleanup) => {
      const f = this.form();
      if (!f) return;
      const sub = f
        .group()
        .get('branch')
        ?.valueChanges.subscribe((v) => this.branch.set(v as string));
      onCleanup(() => sub?.unsubscribe());
    });
  }

  edit() {
    this.mode.set('edit');
  }

  close() {
    this.dialog.close();
  }

  async cancel() {
    if (this.mode() !== 'view' && this.form()?.dirty()) {
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

    const data = {
      name: v['name'] as string,
      branch: v['branch'] as string,
      trainer: (v['trainer'] as string) || '',
      studio: (v['studio'] as string) || '',
      date: v['date'] as string,
      startTime: v['startTime'] as string,
      duration: parseInt(v['duration'] as string, 10) || 45,
      capacity: Number(v['capacity']) || 20,
      description: (v['description'] as string) || '',
    };

    const c = this.cls();
    if (c) {
      this.svc.update(c.id, data).subscribe(() => {
        this.popup.toast('Class updated');
        this.close();
      });
      return;
    }

    this.svc.create({ ...data, enrolled: 0, waitlist: 0, cancelled: false }).subscribe(() => {
      this.popup.toast('Class scheduled');
      this.close();
    });
  }
}
