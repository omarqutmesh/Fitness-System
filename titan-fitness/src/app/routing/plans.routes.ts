import { Routes } from '@angular/router';

const details = () => import('../pages/plans/plan-details/plan-details').then((m) => m.PlanDetails);

export const planRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('../pages/plans/plan-list/plan-list').then((m) => m.PlanList),
  },
  { path: 'new', loadComponent: details, data: { mode: 'add' } },
  { path: ':id', loadComponent: details, data: { mode: 'view' } },
  { path: ':id/edit', loadComponent: details, data: { mode: 'edit' } },
];
