import { Component, computed, inject } from '@angular/core';
import { SystemSessionService } from '../core/session/system-session.service';
import { AppShell, NavItem } from './app-shell';

// Área da equipe (usuários de sistema). Os itens dependem do cargo.
@Component({
  selector: 'app-system-layout',
  imports: [AppShell],
  template: `<app-shell [items]="items()" area="system" areaLabel="Área do sistema" />`
})
export class SystemLayout {
  private readonly session = inject(SystemSessionService);

  readonly items = computed<NavItem[]>(() => {
    const items: NavItem[] = [{ label: 'Início', icon: 'home', link: '/sistema', exact: true }];
    if (this.session.can('users:manage')) items.push({ label: 'Usuários', icon: 'user', link: '/sistema/usuarios' });
    if (this.session.can('system-users:manage')) {
      items.push({ label: 'Novo membro', icon: 'plus', link: '/sistema/equipe/novo', primary: true });
      items.push({ label: 'Equipe', icon: 'briefcase', link: '/sistema/equipe', exact: true });
    }
    return items;
  });
}
