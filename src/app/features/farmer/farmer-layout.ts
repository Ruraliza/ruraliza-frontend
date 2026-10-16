import { Component, DestroyRef, computed, inject } from '@angular/core';
import { ChatInboxService } from '@core/api/chat-inbox.service';
import { NotificationInboxService } from '@core/api/notification-inbox.service';
import { ProfileSummaryService } from '@core/api/profile-summary.service';
import { AppShell, NavItem, ShellNotifications, ShellProfile } from '@core/layout/app-shell';
import { CurrentUserService } from '@core/session/current-user.service';

const PROFILE_LINK = '/produtor/perfil';
const NOTIFICATIONS_LINK = '/produtor/notificacoes';

// Menu do produtor. No celular ficam 5 itens, com "Novo" no meio; o perfil vai para o avatar
// da barra de cima e só aparece como item na sidebar.
export function farmerNavItems(unreadChats: number, unreadNotifications = 0): NavItem[] {
  return [
    { label: 'Início', icon: 'home', link: '/produtor', exact: true },
    { label: 'Serviços', icon: 'list', link: '/produtor/servicos' },
    { label: 'Novo serviço', shortLabel: 'Novo', icon: 'plus', link: '/produtor/servicos/novo', primary: true },
    { label: 'Conversas', icon: 'chat', link: '/produtor/conversas', badge: unreadChats },
    { label: 'Fazendas', icon: 'farm', link: '/produtor/fazendas' },
    { label: 'Notificações', icon: 'bell', link: NOTIFICATIONS_LINK, sidebarOnly: true, badge: unreadNotifications },
    { label: 'Perfil', icon: 'user', link: PROFILE_LINK, sidebarOnly: true },
    { label: 'Ajuda', icon: 'help', link: '/produtor/ajuda', sidebarOnly: true }
  ];
}

@Component({
  selector: 'app-farmer-layout',
  imports: [AppShell],
  template: `<app-shell [items]="items()" [profile]="profile()" [notifications]="notifications()" area="farmer" areaLabel="Área do produtor" />`
})
export class FarmerLayout {
  private readonly inbox = inject(ChatInboxService);
  private readonly summary = inject(ProfileSummaryService);
  private readonly alerts = inject(NotificationInboxService);

  readonly items = computed(() => farmerNavItems(this.inbox.unread(), this.alerts.unread()));
  readonly notifications = computed<ShellNotifications>(() => ({ link: NOTIFICATIONS_LINK, unread: this.alerts.unread() }));
  readonly profile = computed<ShellProfile>(() => ({
    link: PROFILE_LINK,
    name: this.summary.summary()?.name ?? '',
    photoUrl: this.summary.summary()?.photo_url ?? null
  }));

  constructor() {
    // Conversas (contador do menu), avisos (sino) e nome/foto do avatar enquanto a área estiver aberta.
    const farmerId = inject(CurrentUserService).requireId('farmer');
    const destroyRef = inject(DestroyRef);
    this.inbox.connect('farmer', farmerId, destroyRef);
    this.alerts.connect('farmer', farmerId, destroyRef);
    this.summary.connect('farmer', farmerId, destroyRef);
  }
}
