import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-status-badge',
  templateUrl: './status-badge.html',
})
export class StatusBadge {
  status = input.required<string>();
  cls = computed(() => 'status-' + this.status().toLowerCase());
}
