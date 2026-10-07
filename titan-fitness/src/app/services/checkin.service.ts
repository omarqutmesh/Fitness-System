import { Injectable } from '@angular/core';
import { DataStore } from './data-store';
import { addDays, toIso } from './helpers';

export interface CheckIn {
  id: number;
  memberId: string;
  memberName: string;
  branch: string;
  date: string;
  time: string;
  notes: string;
}

@Injectable({ providedIn: 'root' })
export class CheckInService extends DataStore<CheckIn> {
  protected url = 'data/checkins.json';
  protected storageKey = 'titan:checkins';

  protected override prepare(list: any[]): CheckIn[] {
    const today = toIso(new Date());
    return list.map(({ daysAgo, ...c }) => ({ ...c, date: addDays(today, -(daysAgo ?? 0)) }));
  }

  protected nextId() {
    return Math.max(0, ...this.items().map((c) => c.id)) + 1;
  }
}
