import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { BranchService } from '../../services/branch.service';
import { DialogService } from '../../services/dialog.service';
import { SearchService } from '../../services/search.service';

@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './layout.html',
})
export class Layout {
  branch = inject(BranchService);
  search = inject(SearchService);
  dialog = inject(DialogService);

  menuOpen = signal(false);

  links = [
    { path: '/dashboard', label: 'Dashboard', icon: 'bi-grid-1x2' },
    { path: '/members', label: 'Members', icon: 'bi-people' },
    { path: '/classes', label: 'Classes', icon: 'bi-calendar-event' },
    { path: '/trainers', label: 'Trainers', icon: 'bi-person-badge' },
    { path: '/plans', label: 'Plans', icon: 'bi-card-list' },
  ];

  constructor() {
    const router = inject(Router);
    let section = '';

    router.events
      .pipe(
        filter((e) => e instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe((e) => {
        const next = e.urlAfterRedirects.split('?')[0].split('/')[1] ?? '';
        if (next !== section) {
          section = next;
          this.search.clear();
        }
      });
  }

  toggle() {
    this.menuOpen.update((v) => !v);
  }

  close() {
    this.menuOpen.set(false);
  }

  newCheckIn() {
    this.close();
    this.dialog.checkIn();
  }
}
