import { Injectable, signal } from '@angular/core';
import { GymClass } from '../pages/classes/classes.data';
import { Member } from './member.service';

export type ClassMode = 'add' | 'view' | 'edit';

export type DialogState =
  | { kind: 'member'; member?: Member }
  | { kind: 'class'; mode: ClassMode; cls?: GymClass }
  | { kind: 'checkin'; member?: Member };

@Injectable({ providedIn: 'root' })
export class DialogService {
  state = signal<DialogState | null>(null);

  addMember() {
    this.state.set({ kind: 'member' });
  }

  editMember(member: Member) {
    this.state.set({ kind: 'member', member });
  }

  openClass(mode: ClassMode, cls?: GymClass) {
    this.state.set({ kind: 'class', mode, cls });
  }

  checkIn(member?: Member) {
    this.state.set({ kind: 'checkin', member });
  }

  close() {
    this.state.set(null);
  }
}