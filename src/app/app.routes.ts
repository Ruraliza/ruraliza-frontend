import { Routes } from '@angular/router';
import { requireRole } from './core/session/require-role.guard';
import { PublicLayout } from './layouts/public-layout';
import { LandingPage } from './pages/public/landing-page';
import { SignInPage } from './pages/public/sign-in-page';
import { SignupChoicePage } from './pages/public/signup-choice-page';
import { SignupPage } from './pages/public/signup-page';

// URLs em português; nomes de componentes em inglês.
export const routes: Routes = [
  {
    path: '',
    component: PublicLayout,
    children: [
      { path: '', component: LandingPage, title: 'Ruraliza — serviços no campo' },
      { path: 'cadastro', component: SignupChoicePage, title: 'Criar conta · Ruraliza' },
      { path: 'cadastro/produtor', component: SignupPage, data: { role: 'farmer' }, title: 'Cadastro de produtor · Ruraliza' },
      { path: 'cadastro/trabalhador', component: SignupPage, data: { role: 'worker' }, title: 'Cadastro de trabalhador · Ruraliza' },
      { path: 'entrar', component: SignInPage, title: 'Entrar · Ruraliza' }
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
