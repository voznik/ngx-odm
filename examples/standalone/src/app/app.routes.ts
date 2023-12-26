import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  {
    path: 'todos',
    loadComponent: () => import('./todos/todos.component').then(mod => mod.TodosComponent),
  },
  {
    path: '',
    redirectTo: 'todos',
    pathMatch: 'full',
  },
];
