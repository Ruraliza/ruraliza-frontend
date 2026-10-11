import { Component, DestroyRef, computed, inject } from '@angular/core';
import { ChatInboxService } from '@core/api/chat-inbox.service';
import { AppShell, NavItem } from '@core/layout/app-shell';
import { CurrentUserService } from '@core/session/current-user.service';

@Component({
  selector: 'app-worker-layout',
  imports: [AppShell],
  template: `<app-shell [items]="items()" area="worker" areaLabel="Área do trabalhador" />`
})
export class WorkerLayout {
  private readonly inbox = inject(ChatInboxService);

  readonly items = computed<NavItem[]>(() => [
    { label: 'Início', icon: 'home', link: '/trabalhador', exact: true },
    // No celular, "Buscar" já abre as vagas: "Vagas" fica só na sidebar e o menu de baixo cabe em 5 itens.
    { label: 'Vagas', icon: 'briefcase', link: '/trabalhador/vagas', sidebarOnly: true },
    { label: 'Candidaturas', icon: 'list', link: '/trabalhador/candidaturas' },
    { label: 'Buscar', icon: 'search', link: '/trabalhador/vagas', queryParams: { buscar: '1' }, primary: true },
    { label: 'Conversas', icon: 'chat', link: '/trabalhador/conversas', badge: this.inbox.unread() },
    { label: 'Trilhas', icon: 'book', link: '/trabalhador/trilhas' },
    { label: 'Perfil', icon: 'user', link: '/trabalhador/perfil' }
  ]);

  constructor() {
    // Conversas do trabalhador (contador do menu) enquanto a área estiver aberta.
    this.inbox.connect('worker', inject(CurrentUserService).requireId('worker'), inject(DestroyRef));
  }
}
