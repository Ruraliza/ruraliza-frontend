import { Component, DestroyRef, computed, inject } from '@angular/core';
import { ChatInboxService } from '@core/api/chat-inbox.service';
import { AppShell, NavItem } from '@core/layout/app-shell';
import { CurrentUserService } from '@core/session/current-user.service';

@Component({
  selector: 'app-farmer-layout',
  imports: [AppShell],
  template: `<app-shell [items]="items()" area="farmer" areaLabel="Área do produtor" />`
})
export class FarmerLayout {
  private readonly inbox = inject(ChatInboxService);

  readonly items = computed<NavItem[]>(() => [
    { label: 'Início', icon: 'home', link: '/produtor', exact: true },
    { label: 'Serviços', icon: 'list', link: '/produtor/servicos' },
    { label: 'Novo serviço', shortLabel: 'Novo', icon: 'plus', link: '/produtor/servicos/novo', primary: true },
    { label: 'Conversas', icon: 'chat', link: '/produtor/conversas', badge: this.inbox.unread() },
    { label: 'Fazendas', icon: 'farm', link: '/produtor/fazendas' },
    { label: 'Perfil', icon: 'user', link: '/produtor/perfil' }
  ]);

  constructor() {
    // Conversas do produtor (contador do menu) enquanto a área estiver aberta.
    this.inbox.connect('farmer', inject(CurrentUserService).requireId('farmer'), inject(DestroyRef));
  }
}
