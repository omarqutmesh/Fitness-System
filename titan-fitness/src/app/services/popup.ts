import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: number;
  text: string;
  type: 'success' | 'danger' | 'info';
}

export interface ConfirmState {
  title: string;
  message: string;
  confirmText: string;
  resolve: (ok: boolean) => void;
}

@Injectable({ providedIn: 'root' })
export class PopupService {
  toasts = signal<Toast[]>([]);
  confirmState = signal<ConfirmState | null>(null);
  private nextId = 1;

  toast(text: string, type: Toast['type'] = 'success') {
    const id = this.nextId++;
    this.toasts.update((list) => [...list, { id, text, type }]);
    setTimeout(() => this.dismiss(id), 3500);
  }

  error(text: string) {
    this.toast(text, 'danger');
  }

  dismiss(id: number) {
    this.toasts.update((list) => list.filter((t) => t.id !== id));
  }

  confirm(title: string, message: string, confirmText = 'Confirm'): Promise<boolean> {
    return new Promise((resolve) => {
      this.confirmState.set({ title, message, confirmText, resolve });
    });
  }

  answer(ok: boolean) {
    this.confirmState()?.resolve(ok);
    this.confirmState.set(null);
  }
}
