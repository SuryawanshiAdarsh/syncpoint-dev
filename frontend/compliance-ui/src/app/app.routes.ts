import { Routes } from '@angular/router';
import { authGuard, publicGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  {
    path: 'login',
    canActivate: [publicGuard],
    loadComponent: () => import('./features/login/login.component').then(m => m.LoginComponent),
  },
  {
    path: 'register',
    canActivate: [publicGuard],
    loadComponent: () => import('./features/register/register.component').then(m => m.RegisterComponent),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./shared/shell/shell.component').then(m => m.ShellComponent),
    children: [
      { path: 'dashboard',    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'review-queue', loadComponent: () => import('./features/review-queue/review-queue.component').then(m => m.ReviewQueueComponent) },
      { path: 'controls',     loadComponent: () => import('./features/controls/controls.component').then(m => m.ControlsComponent) },
      { path: 'controls/:id', loadComponent: () => import('./features/controls/control-detail.component').then(m => m.ControlDetailComponent) },
      { path: 'evidence',     loadComponent: () => import('./features/evidence/evidence.component').then(m => m.EvidenceComponent) },
      { path: 'integrations', loadComponent: () => import('./features/integrations/integrations.component').then(m => m.IntegrationsComponent) },
      { path: 'onboarding',   loadComponent: () => import('./features/onboarding/onboarding.component').then(m => m.OnboardingComponent) },
      { path: 'ask',          loadComponent: () => import('./features/ask/ask.component').then(m => m.AskComponent) },
      { path: 'audit-package', loadComponent: () => import('./features/export/export.component').then(m => m.ExportComponent) },
    ]
  },
  { path: '**', redirectTo: 'dashboard' },
];
