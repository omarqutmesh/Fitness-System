import { Injectable } from '@angular/core';
import { DataStore } from './data-store';

export interface Member {
  id: string;
  name: string;
  branch: string;
  status: 'Active' | 'Frozen' | 'Expired';
  lastVisit: string;
  email: string;
  phone: string;
  address: string;
  joined: string;
  plan: string;
  price: number;
  endDate: string;
  freezesUsed: number;
  freezesMax: number;
  guestUsed: number;
  guestMax: number;
}

@Injectable({ providedIn: 'root' })
export class MemberService extends DataStore<Member> {
  protected url = 'data/members.json';
  protected storageKey = 'titan:members';

  protected nextId() {
    const max = Math.max(0, ...this.items().map((m) => Number(m.id.slice(3))));
    return `TF-${max + 1}`;
  }
}
