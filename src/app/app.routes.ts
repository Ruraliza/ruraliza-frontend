import { inject } from '@angular/core';
import { RedirectFunction, Router, Routes } from '@angular/router';
import { requireRole, requireSignedIn } from './core/session/require-role.guard';
import { ROLE_SLUG } from './core/session/roles';
import { UserRole } from '../models/auth.model';
import { PublicLayout } from './layouts/public-layout';
import { LandingPage } from './pages/public/landing-page';

// Endereços antigos do cadastro (um por perfil): viram a alternativa já marcada, mantendo os
// query params (ex.: o rascunho de vaga da landing).
function signupFor(role: UserRole): RedirectFunction {
  return ({ queryParams }) => inject(Router).createUrlTree(['/cadastro'], { queryParams: { ...queryParams, papel: ROLE_SLUG[role] } });
}

// URLs em português; nomes de componentes em inglês.
export const routes: Routes = [
  {
    path: '',
    component: PublicLayout,
    children: [
      { path: '', component: LandingPage, title: 'Ruraliza — serviços no campo' },
      { path: 'cadastro', loadComponent: () => import('./pages/public/signup-page').then((m) => m.SignupPage), title: 'Criar conta · Ruraliza' },
      { path: 'cadastro/produtor', redirectTo: signupFor('farmer') },
      { path: 'cadastro/trabalhador', redirectTo: signupFor('worker') },
      { path: 'entrar', loadComponent: () => import('./pages/public/sign-in-page').then((m) => m.SignInPage), title: 'Entrar · Ruraliza' },
      { path: 'entrar/esqueci-senha', loadComponent: () => import('./pages/public/forgot-password-page').then((m) => m.ForgotPasswordPage), title: 'Esqueci minha senha · Ruraliza' },
      { path: 'entrar/nova-senha', loadComponent: () => import('./pages/public/reset-password-page').then((m) => m.ResetPasswordPage), title: 'Nova senha · Ruraliza' },
      {
        path: 'conta/novo-perfil/:papel',
        canActivate: [requireSignedIn],
        loadComponent: () => import('./pages/account/new-profile-page').then((m) => m.NewProfilePage),
        title: 'Novo perfil · Ruraliza'
      },
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
  { path: 'register/farmer', redirectTo: signupFor('farmer') },
  { path: '**', redirectTo: '' }
];
