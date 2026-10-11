import { Routes } from '@angular/router';
import { WorkerLayout } from './worker-layout';
import { WorkerDashboardPage } from './pages/worker-dashboard-page';
import { JobsPage } from './pages/jobs-page';
import { JobDetailPage } from './pages/job-detail-page';
import { WorkerApplicationsPage } from './pages/worker-applications-page';
import { WorkerProfilePage } from './pages/worker-profile-page';
import { ChatsPage } from './pages/chats-page';
import { ChatPage } from './pages/chat-page';
import { TracksPage } from './pages/tracks-page';
import { TrackDetailPage } from './pages/track-detail-page';
import { LessonPage } from './pages/lesson-page';
import { CertificatesPage } from './pages/certificates-page';
import { CertificatePage } from './pages/certificate-page';

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
      { path: 'trilhas', component: TracksPage, title: 'Trilhas de estudo · Ruraliza' },
      { path: 'trilhas/:id', component: TrackDetailPage, title: 'Trilha · Ruraliza' },
      // Sem a aula: abre a primeira ainda não concluída.
      { path: 'trilhas/:id/aulas', component: LessonPage, title: 'Aula · Ruraliza' },
      { path: 'trilhas/:id/aulas/:lessonId', component: LessonPage, title: 'Aula · Ruraliza' },
      { path: 'certificados', component: CertificatesPage, title: 'Certificados · Ruraliza' },
      { path: 'certificados/:code', component: CertificatePage, title: 'Certificado · Ruraliza' },
      { path: 'perfil', component: WorkerProfilePage, title: 'Perfil · Ruraliza' }
    ]
  }
];
