import { Routes } from '@angular/router';
import { Layout } from '../sharedComponent/layout/layout';

export const routes: Routes = [
  {
    path: 'book/:id',
    loadComponent: () =>
      import('../pages/classes/member-booking/member-booking').then((m) => m.MemberBooking),
  },
  {
    path: '',
    component: Layout,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('../pages/dashboard/dashboard').then((m) => m.Dashboard),
      },
      {
        path: 'members',
        loadChildren: () => import('./members.routes').then((m) => m.memberRoutes),
      },
      {
        path: 'classes',
        loadChildren: () => import('./classes.routes').then((m) => m.classRoutes),
      },
      {
        path: 'trainers',
        loadChildren: () => import('./trainers.routes').then((m) => m.trainerRoutes),
      },
      {
        path: 'plans',
        loadChildren: () => import('./plans.routes').then((m) => m.planRoutes),
      },
      {
        path: '**',
        loadComponent: () => import('../pages/not-found/not-found').then((m) => m.NotFound),
      },
    ],
  },
];
