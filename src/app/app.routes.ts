import { Routes } from '@angular/router';
import { requireRole } from './core/session/require-role.guard';
import { PublicLayout } from './layouts/public-layout';
import { LandingPage } from './pages/public/landing-page';

// URLs em português; nomes de componentes em inglês.
export const routes: Routes = [
  {
    path: '',
    component: PublicLayout,
    children: [
      { path: '', component: LandingPage, title: 'Ruraliza — serviços no campo' },
      { path: 'cadastro', loadComponent: () => import('./pages/public/signup-choice-page').then((m) => m.SignupChoicePage), title: 'Criar conta · Ruraliza' },
      { path: 'cadastro/produtor', loadComponent: () => import('./pages/public/signup-page').then((m) => m.SignupPage), data: { role: 'farmer' }, title: 'Cadastro de produtor · Ruraliza' },
      { path: 'cadastro/trabalhador', loadComponent: () => import('./pages/public/signup-page').then((m) => m.SignupPage), data: { role: 'worker' }, title: 'Cadastro de trabalhador · Ruraliza' },
      { path: 'entrar', loadComponent: () => import('./pages/public/sign-in-page').then((m) => m.SignInPage), title: 'Entrar · Ruraliza' },
      { path: 'creditos', loadComponent: () => import('./pages/public/credits-page').then((m) => m.CreditsPage), title: 'Créditos das fotos · Ruraliza' }
    ]
  },
  {
    path: 'produtor',
    canActivate: [requireRole('farmer')],
    loadChildren: () => import('./pages/farmer/farmer.routes').then((m) => m.FARMER_ROUTES)
  },
  {
    path: 'trabalhador',
    canActivate: [requireRole('worker')],
    loadChildren: () => import('./pages/worker/worker.routes').then((m) => m.WORKER_ROUTES)
  },
  // Endereço antigo do cadastro.
  { path: 'register/farmer', redirectTo: 'cadastro/produtor' },
  { path: '**', redirectTo: '' }
];
