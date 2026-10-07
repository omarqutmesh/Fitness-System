import { Routes } from '@angular/router';

const details = () =>
  import('../pages/trainers/trainer-details/trainer-details').then((m) => m.TrainerDetails);

export const trainerRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('../pages/trainers/trainer-list/trainer-list').then((m) => m.TrainerList),
  },
  { path: 'new', loadComponent: details, data: { mode: 'add' } },
  { path: ':id', loadComponent: details, data: { mode: 'view' } },
  { path: ':id/edit', loadComponent: details, data: { mode: 'edit' } },
];
