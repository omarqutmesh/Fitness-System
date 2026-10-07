import { Location } from '@angular/common';
import { Component, computed, inject, signal, viewChild } from '@angular/core';
import { ValidatorFn } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { BranchService } from '../../../services/branch.service';
import { PopupService } from '../../../services/popup.service';
import { Trainer, TrainerService } from '../../../services/trainer.service';
import {
  DynamicForm,
  FieldConfig,
  FormMode,
} from '../../../sharedComponent/dynamic-form/dynamic-form';

@Component({
  selector: 'app-trainer-details',
  imports: [RouterLink, DynamicForm],
  templateUrl: './trainer-details.html',
})
export class TrainerDetails {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);
  private popup = inject(PopupService);
  private branches = inject(BranchService);
  private svc = inject(TrainerService);

  form = viewChild(DynamicForm);

  id = this.route.snapshot.paramMap.get('id') ?? '';
  mode = signal<FormMode>(this.route.snapshot.data['mode']);
  trainer = signal<Trainer | undefined>(undefined);
  loading = signal(!!this.id);
  private fromView = this.mode() === 'view';

  notFound = computed(() => this.mode() !== 'add' && !this.loading() && !this.trainer());
  values = computed(() => this.trainer() ?? {});

  modeLabel = computed(
    () => ({ view: 'View mode', add: 'Add mode', edit: 'Update mode' })[this.mode()],
  );
  subtitle = computed(
    () =>
      ({
        view: 'View trainer information.',
        add: 'Add a trainer to the roster.',
        edit: 'Update trainer information.',
      })[this.mode()],
  );

  private emailUnique: ValidatorFn = (c) => {
    const v = (c.value ?? '').toString().trim().toLowerCase();
    const taken = this.svc.items().some((t) => t.email.toLowerCase() === v && t.id !== this.id);
    return v && taken ? { custom: 'A trainer with this email already exists' } : null;
  };

  fields: FieldConfig[] = [
    {
      key: 'name',
      label: 'Trainer name',
      type: 'text',
      section: 'Trainer Details',
      required: true,
      minLength: 2,
      maxLength: 80,
      placeholder: 'e.g., Sarah Jenkins',
    },
    {
      key: 'specialty',
      label: 'Specialty',
      type: 'text',
      section: 'Trainer Details',
      maxLength: 100,
      placeholder: 'e.g., HIIT / Strength',
    },
    {
      key: 'branch',
      label: 'Branch',
      type: 'select',
      section: 'Trainer Details',
      required: true,
      options: this.branches.names(),
      placeholder: 'Select a branch',
    },
    {
      key: 'email',
      label: 'Email',
      type: 'email',
      section: 'Trainer Details',
      required: true,
      placeholder: 'name@titanfitness.com',
      validators: [this.emailUnique],
    },
    {
      key: 'phone',
      label: 'Phone',
      type: 'tel',
      section: 'Trainer Details',
      placeholder: '+1 (555) 000-0000',
      pattern: /^\+?[\d\s()-]{7,20}$/,
      patternMessage: 'Enter a valid phone number.',
    },
    {
      key: 'isActive',
      label: 'IsActive',
      type: 'checkbox',
      section: 'Trainer Details',
      default: true,
      hint: 'Ticked means true, unticked means false.',
    },
  ];

  constructor() {
    if (this.id) {
      this.svc.getById(this.id).subscribe({
        next: (t) => {
          this.trainer.set(t);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
    } else {
      this.svc.load().subscribe({ error: () => {} });
    }
  }

  private setMode(m: FormMode) {
    this.mode.set(m);
    this.location.go(m === 'edit' ? `/trainers/${this.id}/edit` : `/trainers/${this.id}`);
  }

  startEdit() {
    this.fromView = true;
    this.setMode('edit');
  }

  save() {
    const value = this.form()?.submit() as Omit<Trainer, 'id'> | null;
    if (!value) return;

    if (this.mode() === 'add') {
      this.svc.create(value).subscribe((t) => {
        this.popup.toast('Trainer created');
        this.router.navigate(['/trainers', t.id]);
      });
      return;
    }

    this.svc.update(this.id, value).subscribe((updated) => {
      this.trainer.set(updated);
      this.popup.toast('Trainer updated');
      this.setMode('view');
    });
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
    if (this.mode() === 'edit' && this.fromView) {
      this.setMode('view');
    } else {
      this.router.navigate(['/trainers']);
    }
  }
}
