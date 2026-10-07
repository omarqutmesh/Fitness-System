import { Component, computed, input, model } from '@angular/core';

@Component({
  selector: 'app-paginator',
  templateUrl: './paginator.html',
})
export class Paginator {
  total = input.required<number>();
  pageSize = input(5);
  page = model(1);

  pages = computed(() => {
    const count = Math.max(1, Math.ceil(this.total() / this.pageSize()));
    return Array.from({ length: count }, (_, i) => i + 1);
  });

  from = computed(() => (this.total() === 0 ? 0 : (this.page() - 1) * this.pageSize() + 1));
  to = computed(() => Math.min(this.page() * this.pageSize(), this.total()));

  go(p: number) {
    if (p >= 1 && p <= this.pages().length) {
      this.page.set(p);
    }
  }
}
