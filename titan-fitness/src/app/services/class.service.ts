import { Injectable } from '@angular/core';
import { GymClass } from '../pages/classes/classes.data';
import { DataStore } from './data-store';
import { addDays, toIso } from './helpers';

@Injectable({ providedIn: 'root' })
export class ClassService extends DataStore<GymClass> {
  protected url = 'data/classes.json';
  protected storageKey = 'titan:classes';

  protected override prepare(list: any[]): GymClass[] {
    const today = toIso(new Date());
    return list.map(({ dayOffset, ...c }) => ({ ...c, date: addDays(today, dayOffset ?? 0) }));
  }

  protected nextId() {
    return Math.max(0, ...this.items().map((c) => c.id)) + 1;
  }
}
