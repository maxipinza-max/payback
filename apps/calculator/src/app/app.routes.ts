import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  { path: '', redirectTo: 'estimates', pathMatch: 'full' },
  {
    path: 'estimates',
    loadComponent: () =>
      import('./features/estimates/estimate-list/estimate-list.component').then(
        (m) => m.EstimateListComponent
      ),
  },
  {
    path: 'estimates/new',
    loadComponent: () =>
      import('./features/estimates/estimate-editor/estimate-editor.component').then(
        (m) => m.EstimateEditorComponent
      ),
  },
  {
    path: 'estimates/:id',
    loadComponent: () =>
      import('./features/estimates/estimate-editor/estimate-editor.component').then(
        (m) => m.EstimateEditorComponent
      ),
  },
];
