import { Component, computed, inject } from '@angular/core';
import { SystemPermission, SystemSessionService } from '@core/session/system-session.service';
import { AppShell, NavItem, ShellProfile } from '@core/layout/app-shell';

const PROFILE_LINK = '/sistema/perfil';

// Menu da equipe, pelo que o cargo pode fazer. O perfil fica no avatar da barra de cima do celular
// (na sidebar, como item). O tutor tem "Nova trilha" no meio; o administrador não tem ação central:
// "Novo membro" e "Nova trilha" ficam nas páginas de equipe e de trilhas.
export function systemNavItems(can: (permission: SystemPermission) => boolean): NavItem[] {
  const items: NavItem[] = [{ label: 'Início', icon: 'home', link: '/sistema', exact: true }];
  if (can('users:manage')) items.push({ label: 'Usuários', icon: 'list', link: '/sistema/usuarios' });
  if (can('moderation:manage')) items.push({ label: 'Moderação', icon: 'shield', link: '/sistema/moderacao' });
  if (can('tracks:manage')) {
    items.push({ label: 'Nova trilha', icon: 'plus', link: '/sistema/trilhas/nova', primary: true });
    items.push({ label: 'Trilhas', icon: 'book', link: '/sistema/trilhas' });
  } else if (can('tracks:oversee')) {
    items.push({ label: 'Trilhas', icon: 'book', link: '/sistema/trilhas' });
  }
  if (can('system-users:manage')) items.push({ label: 'Equipe', icon: 'briefcase', link: '/sistema/equipe' });
  // Conteúdo da plataforma: na sidebar; no celular, pelos cartões do Início.
  if (can('content:manage')) {
    items.push({ label: 'Central de ajuda', icon: 'help', link: '/sistema/ajuda', sidebarOnly: true });
    items.push({ label: 'Patrocínios', icon: 'megaphone', link: '/sistema/patrocinios', sidebarOnly: true });
  }
  items.push({ label: 'Perfil', icon: 'user', link: PROFILE_LINK, sidebarOnly: true });
  return items;
}

// Área da equipe (usuários de sistema). Os itens dependem do cargo.
@Component({
  selector: 'app-system-layout',
  imports: [AppShell],
  template: `<app-shell [items]="items()" [profile]="profile()" area="system" areaLabel="Área do sistema" />`
})
export class SystemLayout {
  private readonly session = inject(SystemSessionService);

  readonly items = computed(() => {
    this.session.user(); // o cargo pode mudar (GET /auth/system/me no início)
    return systemNavItems((permission) => this.session.can(permission));
  });
  readonly profile = computed<ShellProfile>(() => ({ link: PROFILE_LINK, name: this.session.user()?.name ?? '', photoUrl: null }));
}
