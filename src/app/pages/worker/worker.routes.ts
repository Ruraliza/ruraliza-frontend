import { Routes } from '@angular/router';
import { WorkerLayout } from '../../layouts/worker-layout';
import { WorkerDashboardPage } from './worker-dashboard-page';
import { JobsPage } from './jobs-page';
import { JobDetailPage } from './job-detail-page';
import { WorkerApplicationsPage } from './worker-applications-page';
import { WorkerProfilePage } from './worker-profile-page';

// Área do trabalhador, carregada sob demanda a partir de /trabalhador.
export const WORKER_ROUTES: Routes = [
  {
    path: '',
    component: WorkerLayout,
    children: [
      { path: '', component: WorkerDashboardPage, title: 'Início · Ruraliza' },
      { path: 'vagas', component: JobsPage, title: 'Vagas · Ruraliza' },
      { path: 'vagas/:id', component: JobDetailPage, title: 'Vaga · Ruraliza' },
      { path: 'candidaturas', component: WorkerApplicationsPage, title: 'Candidaturas · Ruraliza' },
      { path: 'perfil', component: WorkerProfilePage, title: 'Perfil · Ruraliza' }
    ]
  }
];
