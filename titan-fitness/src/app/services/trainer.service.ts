import { Injectable } from '@angular/core';
import { DataStore } from './data-store';

export interface Trainer {
  id: string;
  name: string;
  specialty: string;
  branch: string;
  email: string;
  phone: string;
  isActive: boolean;
}

@Injectable({ providedIn: 'root' })
export class TrainerService extends DataStore<Trainer> {
  protected url = 'data/trainers.json';
  protected storageKey = 'titan:trainers';

  protected nextId() {
    const max = Math.max(0, ...this.items().map((t) => Number(t.id.slice(3))));
    return `TR-${max + 1}`;
  }
}
