import { Routes } from '@angular/router';

export const memberRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('../pages/members/member-list/member-list').then((m) => m.MemberList),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('../pages/members/member-profile/member-profile').then((m) => m.MemberProfile),
  },
  {
    path: ':id/freeze',
    loadComponent: () =>
      import('../pages/members/member-freeze/member-freeze').then((m) => m.MemberFreeze),
  },
];
