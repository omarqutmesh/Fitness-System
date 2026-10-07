import { Component, computed, effect, input, untracked } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';

export type FormMode = 'view' | 'add' | 'edit';

export interface FieldConfig {
  key: string;
  label: string;
  type:
    | 'text'
    | 'email'
    | 'tel'
    | 'number'
    | 'select'
    | 'checkbox'
    | 'radio'
    | 'textarea'
    | 'date'
    | 'time';
  section?: string;
  full?: boolean;
  width?: 'third';
  placeholder?: string;
  required?: boolean;
  hint?: string;
  default?: string | number | boolean;
  options?: string[];
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  integer?: boolean;
  pattern?: RegExp;
  patternMessage?: string;
  validators?: ValidatorFn[];
  dependsOn?: string | string[];
}

function trimRequired(c: AbstractControl): ValidationErrors | null {
  const v = c.value;
  return v === null || v === undefined || v.toString().trim() === '' ? { required: true } : null;
}

function trimLength(min: number, max: number): ValidatorFn {
  return (c) => {
    const v = (c.value ?? '').toString().trim();
    if (!v) return null;
    if (v.length < min) return { minlength: { requiredLength: min } };
    if (v.length > max) return { maxlength: { requiredLength: max } };
    return null;
  };
}

@Component({
  selector: 'app-dynamic-form',
  imports: [ReactiveFormsModule],
  templateUrl: './dynamic-form.html',
})
export class DynamicForm {
  fields = input.required<FieldConfig[]>();
  mode = input<FormMode>('add');
  values = input<object>({});
  plain = input(false);
  lock = input<string[]>([]);

  private keys = computed(() =>
    this.fields()
      .map((f) => f.key)
      .join('|'),
  );

  defaults = computed(() =>
    Object.fromEntries(
      this.fields().map((f) => [f.key, f.default ?? (f.type === 'checkbox' ? false : '')]),
    ),
  );

  group = computed(() => {
    this.keys();
    return untracked(() => this.build());
  });

  sections = computed(() => {
    const map = new Map<string, FieldConfig[]>();
    for (const f of this.fields()) {
      const title = f.section ?? 'Details';
      if (!map.has(title)) map.set(title, []);
      map.get(title)!.push(f);
    }
    return [...map].map(([title, fields]) => ({ title, fields }));
  });

  constructor() {
    effect(() => {
      const g = this.group();
      const v = this.values() as Record<string, unknown>;
      const m = this.mode();
      const lock = this.lock();
      untracked(() => {
        g.reset({ ...this.defaults(), ...v });
        if (m === 'view') {
          g.disable();
        } else {
          g.enable();
          for (const k of lock) g.get(k)?.disable();
        }
      });
    });
  }

  private build() {
    const fields = this.fields();
    const defaults = this.defaults();
    const g = new FormGroup<Record<string, FormControl>>({});

    for (const f of fields) {
      g.addControl(f.key, new FormControl(defaults[f.key], this.validatorsFor(f)));
    }

    for (const f of fields) {
      if (!f.dependsOn) continue;
      const deps = Array.isArray(f.dependsOn) ? f.dependsOn : [f.dependsOn];
      for (const d of deps) {
        g.get(d)?.valueChanges.subscribe(() => g.get(f.key)?.updateValueAndValidity());
      }
    }
    return g;
  }

  private validatorsFor(f: FieldConfig) {
    const list: ValidatorFn[] = [];
    if (f.required && f.type !== 'checkbox') list.push(trimRequired);
    if (f.type === 'email') list.push(Validators.email);
    if (f.minLength !== undefined || f.maxLength !== undefined) {
      list.push(trimLength(f.minLength ?? 0, f.maxLength ?? Infinity));
    }
    if (f.min !== undefined) list.push(Validators.min(f.min));
    if (f.max !== undefined) list.push(Validators.max(f.max));
    if (f.integer) {
      list.push((c) =>
        c.value === null || c.value === '' || Number.isInteger(Number(c.value))
          ? null
          : { integer: true },
      );
    }
    if (f.pattern) list.push(Validators.pattern(f.pattern));
    return [...list, ...(f.validators ?? [])];
  }

  dirty() {
    return this.group().dirty;
  }

  submit() {
    const g = this.group();
    g.markAllAsTouched();
    if (g.invalid) return null;
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(g.getRawValue())) {
      out[k] = typeof v === 'string' ? v.trim() : v;
    }
    return out;
  }

  error(f: FieldConfig) {
    const c = this.group().get(f.key);
    if (!c || !c.touched || !c.errors) return '';
    const e = c.errors;
    if (e['required']) return `${f.label} is required.`;
    if (e['custom']) return e['custom'] as string;
    if (e['email']) return 'Enter a valid email address.';
    if (e['minlength']) return `Must be at least ${e['minlength'].requiredLength} characters.`;
    if (e['maxlength']) return `Must be at most ${e['maxlength'].requiredLength} characters.`;
    if (e['min']) return `Must be at least ${e['min'].min}.`;
    if (e['max']) return `Must be at most ${e['max'].max}.`;
    if (e['integer']) return 'Whole numbers only.';
    if (e['pattern']) return f.patternMessage ?? 'Invalid format.';
    return 'Invalid value.';
  }
}
