import { Routes } from '@angular/router';
import { requireSystemPermission } from '@core/session/require-system.guard';
import { SystemLayout } from './system-layout';
import { AdminUserDetailPage } from './pages/admin-user-detail-page';
import { AdminUsersPage } from './pages/admin-users-page';
import { StaffEditPage } from './pages/staff-edit-page';
import { StaffFormPage } from './pages/staff-form-page';
import { StaffPage } from './pages/staff-page';
import { SystemHomePage } from './pages/system-home-page';
import { SystemProfilePage } from './pages/system-profile-page';
import { TracksAdminPage } from './pages/tracks-admin-page';
import { TrackNewPage } from './pages/track-new-page';
import { TrackEditorPage } from './pages/track-editor-page';
import { HelpAdminPage } from './pages/help-admin-page';
import { ModerationPage } from './pages/moderation-page';

// Trilhas: os tutores (as próprias) e o administrador (todas).
const TRACKS = ['tracks:manage', 'tracks:oversee'] as const;

// Área da equipe, carregada sob demanda a partir de /sistema (o login fica fora, em /sistema/entrar).
export const SYSTEM_ROUTES: Routes = [
  {
    path: '',
    component: SystemLayout,
    children: [
      { path: '', component: SystemHomePage, title: 'Sistema · Ruraliza' },
      { path: 'usuarios', component: AdminUsersPage, canActivate: [requireSystemPermission('users:manage')], title: 'Usuários · Ruraliza' },
      { path: 'usuarios/:id', component: AdminUserDetailPage, canActivate: [requireSystemPermission('users:manage')], title: 'Usuário · Ruraliza' },
      { path: 'equipe', component: StaffPage, canActivate: [requireSystemPermission('system-users:manage')], title: 'Equipe · Ruraliza' },
      { path: 'equipe/novo', component: StaffFormPage, canActivate: [requireSystemPermission('system-users:manage')], title: 'Novo membro · Ruraliza' },
      { path: 'equipe/:id/editar', component: StaffEditPage, canActivate: [requireSystemPermission('system-users:manage')], title: 'Editar membro · Ruraliza' },
      { path: 'trilhas', component: TracksAdminPage, canActivate: [requireSystemPermission(TRACKS)], title: 'Trilhas · Ruraliza' },
      { path: 'trilhas/nova', component: TrackNewPage, canActivate: [requireSystemPermission(TRACKS)], title: 'Nova trilha · Ruraliza' },
      { path: 'trilhas/:id', component: TrackEditorPage, canActivate: [requireSystemPermission(TRACKS)], title: 'Trilha · Ruraliza' },
      { path: 'moderacao', component: ModerationPage, canActivate: [requireSystemPermission('moderation:manage')], title: 'Moderação · Ruraliza' },
      { path: 'ajuda', component: HelpAdminPage, canActivate: [requireSystemPermission('content:manage')], title: 'Central de ajuda · Ruraliza' },
      { path: 'perfil', component: SystemProfilePage, title: 'Perfil · Ruraliza' }
    ]
  }
];
