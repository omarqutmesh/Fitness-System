import { Injectable } from '@angular/core';
import { DataStore } from './data-store';

export interface Plan {
  id: number;
  name: string;
  price: number;
  duration: number;
  freezeDays: number;
  maxFreezes: number;
  guestPasses: number;
  access: 'All branches' | 'Home branch only';
  isPublished: boolean;
}

export function durationLabel(n: number) {
  return `${n} ${n === 1 ? 'month' : 'months'}`;
}

@Injectable({ providedIn: 'root' })
export class PlanService extends DataStore<Plan> {
  protected url = 'data/plans.json';
  protected storageKey = 'titan:plans';

  protected nextId() {
    return Math.max(0, ...this.items().map((p) => p.id)) + 1;
  }
}
