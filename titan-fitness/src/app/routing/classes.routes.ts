import { Routes } from '@angular/router';

export const classRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('../pages/classes/class-schedule/class-schedule').then((m) => m.ClassSchedule),
  },
  {
    path: ':id/book',
    loadComponent: () =>
      import('../pages/classes/book-session/book-session').then((m) => m.BookSession),
  },
];
