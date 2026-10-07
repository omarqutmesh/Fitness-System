import { Location } from '@angular/common';
import { Component, computed, inject, signal, viewChild } from '@angular/core';
import { ValidatorFn } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PopupService } from '../../../services/popup.service';
import {
  DynamicForm,
  FieldConfig,
  FormMode,
} from '../../../sharedComponent/dynamic-form/dynamic-form';
import { Plan, PlanService } from '../../../services/plan.service';

@Component({
  selector: 'app-plan-details',
  imports: [RouterLink, DynamicForm],
  templateUrl: './plan-details.html',
})
export class PlanDetails {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);
  private popup = inject(PopupService);

  private svc = inject(PlanService);

  form = viewChild(DynamicForm);

  id = this.route.snapshot.paramMap.get('id') ?? '';
  mode = signal<FormMode>(this.route.snapshot.data['mode']);
  plan = signal<Plan | undefined>(undefined);
  loading = signal(!!this.id);
  private fromView = this.mode() === 'view';

  notFound = computed(() => this.mode() !== 'add' && !this.loading() && !this.plan());

  values = computed(() => this.plan() ?? {});

  modeLabel = computed(
    () => ({ view: 'View mode', add: 'Add mode', edit: 'Update mode' })[this.mode()],
  );
  subtitle = computed(
    () =>
      ({
        view: 'View plan information.',
        add: 'Add a membership plan to the catalogue.',
        edit: 'Update plan information.',
      })[this.mode()],
  );

  private nameUnique: ValidatorFn = (c) => {
    const v = (c.value ?? '').toString().trim().toLowerCase();
    const taken = this.svc
      .items()
      .some((p) => p.name.toLowerCase() === v && String(p.id) !== this.id);
    return v && taken ? { custom: 'A plan with this name already exists' } : null;
  };

  private twoDecimals: ValidatorFn = (c) => {
    const v = c.value;
    if (v === null || v === '') return null;
    const cents = Number(v) * 100;
    return Math.abs(Math.round(cents) - cents) < 1e-6
      ? null
      : { custom: 'Use at most 2 decimals.' };
  };

  private freezesNeedDays: ValidatorFn = (c) => {
    const days = Number(c.parent?.get('freezeDays')?.value) || 0;
    return days === 0 && Number(c.value) > 0
      ? { custom: 'Must be 0 when freeze days is 0.' }
      : null;
  };

  fields: FieldConfig[] = [
    {
      key: 'name',
      label: 'Plan name',
      type: 'text',
      section: 'Plan Details',
      required: true,
      minLength: 2,
      maxLength: 60,
      placeholder: 'e.g., Annual Pro',
      validators: [this.nameUnique],
    },
    {
      key: 'price',
      label: 'Price',
      type: 'number',
      section: 'Plan Details',
      required: true,
      min: 0,
      placeholder: '0.00',
      validators: [this.twoDecimals],
    },
    {
      key: 'duration',
      label: 'Duration in months',
      type: 'number',
      section: 'Plan Details',
      required: true,
      integer: true,
      min: 1,
      max: 36,
      placeholder: 'e.g., 12',
    },
    {
      key: 'isPublished',
      label: 'IsPublished',
      type: 'checkbox',
      section: 'Plan Details',
      default: false,
      hint: 'Ticked means true, unticked means false.',
    },
    {
      key: 'freezeDays',
      label: 'Maximum freeze days',
      type: 'number',
      section: 'Terms Offered',
      integer: true,
      min: 0,
      placeholder: '0',
    },
    {
      key: 'maxFreezes',
      label: 'Maximum number of freezes',
      type: 'number',
      section: 'Terms Offered',
      integer: true,
      min: 0,
      placeholder: '0',
      dependsOn: 'freezeDays',
      validators: [this.freezesNeedDays],
    },
    {
      key: 'guestPasses',
      label: 'Guest pass quota',
      type: 'number',
      section: 'Terms Offered',
      integer: true,
      min: 0,
      placeholder: '0',
    },
    {
      key: 'access',
      label: 'Access scope',
      type: 'radio',
      section: 'Terms Offered',
      options: ['Home branch only', 'All branches'],
    },
  ];
  constructor() {
    if (this.id) {
      this.svc.getById(this.id).subscribe({
        next: (p) => {
          this.plan.set(p);
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
    this.location.go(m === 'edit' ? `/plans/${this.id}/edit` : `/plans/${this.id}`);
  }

  startEdit() {
    this.fromView = true;
    this.setMode('edit');
  }

  save() {
    const v = this.form()?.submit();
    if (!v) return;

    const data = {
      name: v['name'] as string,
      price: Number(v['price']),
      duration: Number(v['duration']),
      isPublished: !!v['isPublished'],
      freezeDays: Number(v['freezeDays']) || 0,
      maxFreezes: Number(v['maxFreezes']) || 0,
      guestPasses: Number(v['guestPasses']) || 0,
      access: (v['access'] || 'Home branch only') as Plan['access'],
    };

    if (this.mode() === 'add') {
      this.svc.create(data).subscribe((p) => {
        this.popup.toast(`${p.name} created`);
        this.router.navigate(['/plans', p.id]);
      });
      return;
    }

    this.svc.update(Number(this.id), data).subscribe((updated) => {
      this.plan.set(updated);
      this.popup.toast('Plan updated');
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
      this.router.navigate(['/plans']);
    }
  }
}
