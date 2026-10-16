import { Component, DestroyRef, computed, inject } from '@angular/core';
import { ChatInboxService } from '@core/api/chat-inbox.service';
import { NotificationInboxService } from '@core/api/notification-inbox.service';
import { ProfileSummaryService } from '@core/api/profile-summary.service';
import { AppShell, NavItem, ShellNotifications, ShellProfile } from '@core/layout/app-shell';
import { CurrentUserService } from '@core/session/current-user.service';

const PROFILE_LINK = '/trabalhador/perfil';
const NOTIFICATIONS_LINK = '/trabalhador/notificacoes';

// Menu do trabalhador. No celular ficam 5 itens, com "Buscar" no meio: "Vagas" é a mesma tela
// e fica só na sidebar, e o perfil vai para o avatar da barra de cima.
export function workerNavItems(unreadChats: number, unreadNotifications = 0): NavItem[] {
  return [
    { label: 'Início', icon: 'home', link: '/trabalhador', exact: true },
    { label: 'Vagas', icon: 'briefcase', link: '/trabalhador/vagas', sidebarOnly: true },
    { label: 'Candidaturas', icon: 'list', link: '/trabalhador/candidaturas' },
    { label: 'Buscar', icon: 'search', link: '/trabalhador/vagas', queryParams: { buscar: '1' }, primary: true },
    { label: 'Conversas', icon: 'chat', link: '/trabalhador/conversas', badge: unreadChats },
    { label: 'Trilhas', icon: 'book', link: '/trabalhador/trilhas' },
    { label: 'Notificações', icon: 'bell', link: NOTIFICATIONS_LINK, sidebarOnly: true, badge: unreadNotifications },
    { label: 'Perfil', icon: 'user', link: PROFILE_LINK, sidebarOnly: true },
    { label: 'Ajuda', icon: 'help', link: '/trabalhador/ajuda', sidebarOnly: true }
  ];
}

@Component({
  selector: 'app-worker-layout',
  imports: [AppShell],
  template: `<app-shell [items]="items()" [profile]="profile()" [notifications]="notifications()" area="worker" areaLabel="Área do trabalhador" />`
})
export class WorkerLayout {
  private readonly inbox = inject(ChatInboxService);
  private readonly summary = inject(ProfileSummaryService);
  private readonly alerts = inject(NotificationInboxService);

  readonly items = computed(() => workerNavItems(this.inbox.unread(), this.alerts.unread()));
  readonly notifications = computed<ShellNotifications>(() => ({ link: NOTIFICATIONS_LINK, unread: this.alerts.unread() }));
  readonly profile = computed<ShellProfile>(() => ({
    link: PROFILE_LINK,
    name: this.summary.summary()?.name ?? '',
    photoUrl: this.summary.summary()?.photo_url ?? null
  }));

  constructor() {
    // Conversas (contador do menu), avisos (sino) e nome/foto do avatar enquanto a área estiver aberta.
    const workerId = inject(CurrentUserService).requireId('worker');
    const destroyRef = inject(DestroyRef);
    this.inbox.connect('worker', workerId, destroyRef);
    this.alerts.connect('worker', workerId, destroyRef);
    this.summary.connect('worker', workerId, destroyRef);
  }
}
