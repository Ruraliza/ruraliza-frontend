import { Routes } from '@angular/router';
import { WorkerLayout } from './worker-layout';
import { WorkerDashboardPage } from './pages/worker-dashboard-page';
import { JobsPage } from './pages/jobs-page';
import { JobDetailPage } from './pages/job-detail-page';
import { WorkerApplicationsPage } from './pages/worker-applications-page';
import { WorkerProfilePage } from './pages/worker-profile-page';
import { ChatsPage } from './pages/chats-page';
import { ChatPage } from './pages/chat-page';

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
      { path: 'conversas', component: ChatsPage, title: 'Conversas · Ruraliza' },
      { path: 'conversas/:id', component: ChatPage, title: 'Conversa · Ruraliza' },
      { path: 'perfil', component: WorkerProfilePage, title: 'Perfil · Ruraliza' }
    ]
  }
];
