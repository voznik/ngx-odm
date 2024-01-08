import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  {
    path: 'todos',
    loadComponent: () => import('./todos/todos.component').then(mod => mod.TodosComponent),
    runGuardsAndResolvers: 'always',
  },
  {
    path: '',
    redirectTo: 'todos',
    pathMatch: 'full',
  },
];
