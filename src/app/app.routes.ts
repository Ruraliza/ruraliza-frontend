import { inject } from '@angular/core';
import { RedirectFunction, Router, Routes } from '@angular/router';
import { requireRole, requireSignedIn } from '@core/session/require-role.guard';
import { requireSystemSignedIn } from '@core/session/require-system.guard';
import { ROLE_SLUG } from '@core/session/roles';
import { UserRole } from '@core/models/auth.model';
import { PublicLayout } from '@core/layout/public-layout';
import { LandingPage } from '@features/public/pages/landing-page';

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
      { path: 'cadastro', loadComponent: () => import('@features/auth/pages/signup-page').then((m) => m.SignupPage), title: 'Criar conta · Ruraliza' },
      { path: 'cadastro/produtor', redirectTo: signupFor('farmer') },
      { path: 'cadastro/trabalhador', redirectTo: signupFor('worker') },
      { path: 'entrar', loadComponent: () => import('@features/auth/pages/sign-in-page').then((m) => m.SignInPage), title: 'Entrar · Ruraliza' },
      { path: 'entrar/esqueci-senha', loadComponent: () => import('@features/auth/pages/forgot-password-page').then((m) => m.ForgotPasswordPage), title: 'Esqueci minha senha · Ruraliza' },
      { path: 'entrar/nova-senha', loadComponent: () => import('@features/auth/pages/reset-password-page').then((m) => m.ResetPasswordPage), title: 'Nova senha · Ruraliza' },
      {
        path: 'conta/novo-perfil/:papel',
        canActivate: [requireSignedIn],
        loadComponent: () => import('@features/account/pages/new-profile-page').then((m) => m.NewProfilePage),
        title: 'Novo perfil · Ruraliza'
      },
      // Equipe do Ruraliza: sem link no site nem no cadastro (usuários de sistema não se cadastram).
      {
        path: 'sistema/entrar',
        loadComponent: () => import('@features/system/pages/system-sign-in-page').then((m) => m.SystemSignInPage),
        title: 'Acesso da equipe · Ruraliza'
      },
      // Validação pública dos certificados das trilhas (o código vai impresso no certificado).
      {
        path: 'certificados',
        loadComponent: () => import('@features/public/pages/certificate-validation-page').then((m) => m.CertificateValidationPage),
        title: 'Validar certificado · Ruraliza'
      },
      {
        path: 'certificados/:code',
        loadComponent: () => import('@features/public/pages/certificate-validation-page').then((m) => m.CertificateValidationPage),
        title: 'Certificado · Ruraliza'
      },
      { path: 'creditos', loadComponent: () => import('@features/public/pages/credits-page').then((m) => m.CreditsPage), title: 'Créditos das fotos · Ruraliza' },
      { path: 'termos', loadComponent: () => import('@features/public/pages/terms-page').then((m) => m.TermsPage), title: 'Termos de Uso · Ruraliza' },
      { path: 'privacidade', loadComponent: () => import('@features/public/pages/privacy-page').then((m) => m.PrivacyPage), title: 'Política de Privacidade · Ruraliza' },
      { path: 'ajuda', loadComponent: () => import('@features/public/pages/help-page').then((m) => m.HelpPage), title: 'Central de ajuda · Ruraliza' }
    ]
  },
  {
    path: 'produtor',
    canActivate: [requireRole('farmer')],
    loadChildren: () => import('@features/farmer/farmer.routes').then((m) => m.FARMER_ROUTES)
  },
  {
    path: 'trabalhador',
    canActivate: [requireRole('worker')],
    loadChildren: () => import('@features/worker/worker.routes').then((m) => m.WORKER_ROUTES)
  },
  {
    path: 'sistema',
    canActivate: [requireSystemSignedIn],
    loadChildren: () => import('@features/system/system.routes').then((m) => m.SYSTEM_ROUTES)
  },
  // Endereço antigo do cadastro.
  { path: 'register/farmer', redirectTo: signupFor('farmer') },
  { path: '**', redirectTo: '' }
];
