import { Component, computed, inject, input } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { UserRole } from '../session/current-user.service';
import { RoleSwitchService } from '../session/role-switch.service';
import { SystemSessionService } from '../session/system-session.service';
import { Icon, IconName } from '@shared/ui/icon';
import { Logo } from '@shared/ui/logo';
import { ShellTopbar } from './shell-topbar';

export interface NavItem {
  label: string;
  icon: IconName;
  link: string;
  queryParams?: Record<string, string>;
  exact?: boolean;
  primary?: boolean; // ação central: botão flutuante no mobile, primeiro item destacado na sidebar
  badge?: number; // contador (ex.: mensagens não lidas); 0 ou ausente não aparece
  shortLabel?: string; // rótulo no menu de baixo do celular, onde cada item tem ~75px
  sidebarOnly?: boolean; // só na sidebar (no celular outro caminho já leva à mesma tela)
}

// Quem está no painel: o avatar da barra de cima do celular leva ao perfil.
export interface ShellProfile {
  link: string;
  name: string; // vazio enquanto carrega: aparece o ícone de perfil
  photoUrl: string | null;
}

// Regra do menu de baixo (Material e iOS): de 3 a 5 destinos. Com número ímpar, a ação central
// fica no meio de verdade. O que não cabe vai para a sidebar (sidebarOnly) e ganha outro caminho
// no celular, como o perfil, que fica no avatar da barra de cima.
export const MAX_BOTTOM_NAV_ITEMS = 5;

export function bottomNavItems(items: readonly NavItem[]): NavItem[] {
  return items.filter((item) => !item.sidebarOnly);
}

// Casca das áreas logadas. No celular (< 1024px): barra de cima com a marca e o avatar (perfil)
// e menu de baixo com até 5 itens. No desktop: sidebar com todos os itens e, no fim, trocar de
// painel e sair (no celular, os dois ficam na página de perfil). Na área de sistema não há troca de painel.
// O primeiro item é sempre o Início: a marca da barra de cima leva a ele.
@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Icon, Logo, ShellTopbar],
  template: `
    <a class="skip-link" href="#conteudo">Pular para o conteúdo</a>

    <app-shell-topbar [homeLink]="homeLink()" [areaLabel]="areaLabel()" [profile]="profile()" />

    <div class="shell">
      <aside class="sidebar" [attr.aria-label]="areaLabel()">
        <app-logo class="sidebar-logo" />
        <p class="area t-label muted">{{ areaLabel() }}</p>
        <nav class="side-nav" [attr.aria-label]="areaLabel()">
          @for (item of sidebarItems(); track item.label) {
            <a
              [routerLink]="item.link"
              [queryParams]="item.queryParams"
              [class.primary]="item.primary"
              routerLinkActive="active"
              [routerLinkActiveOptions]="{ exact: !!item.exact }"
              [ariaCurrentWhenActive]="item.primary ? undefined : 'page'"
            >
              <app-icon [name]="item.icon" />{{ item.label }}
              @if (item.badge) { <span class="badge" aria-hidden="true">{{ count(item.badge) }}</span><span class="visually-hidden">, {{ unreadLabel(item.badge) }}</span> }
            </a>
          }
        </nav>
        <div class="account-actions">
          @if (accountArea(); as role) {
            <button type="button" class="switch" [disabled]="switcher.switching()" (click)="switcher.switchFrom(role)">
              <app-icon name="swap" />{{ switcher.labelFor(role) }}
            </button>
          }
          <button type="button" class="switch" (click)="signOut()"><app-icon name="logout" />Sair</button>
        </div>
      </aside>

      <main id="conteudo" tabindex="-1"><router-outlet /></main>
    </div>

    <nav class="bottom-nav" [attr.aria-label]="areaLabel()">
      @for (item of bottomItems(); track item.label) {
        <a
          [routerLink]="item.link"
          [queryParams]="item.queryParams"
          [class.primary]="item.primary"
          routerLinkActive="active"
          [routerLinkActiveOptions]="{ exact: !!item.exact }"
          [ariaCurrentWhenActive]="item.primary ? undefined : 'page'"
        >
          <span class="bubble"><app-icon [name]="item.icon" />@if (item.badge) { <span class="badge" aria-hidden="true">{{ count(item.badge) }}</span> }</span>
          <span class="label">{{ item.shortLabel ?? item.label }}@if (item.badge) { <span class="visually-hidden">, {{ unreadLabel(item.badge) }}</span> }</span>
        </a>
      }
    </nav>
  `,
  styleUrl: './app-shell.css'
})
export class AppShell {
  readonly items = input.required<NavItem[]>();
  readonly areaLabel = input.required<string>();
  readonly area = input.required<UserRole | 'system'>();
  readonly profile = input<ShellProfile | null>(null);

  protected readonly switcher = inject(RoleSwitchService);
  private readonly systemSession = inject(SystemSessionService);
  private readonly router = inject(Router);

  // Painel de conta do app (com troca de painel); null na área de sistema.
  readonly accountArea = computed(() => {
    const area = this.area();
    return area === 'system' ? null : area;
  });

  readonly homeLink = computed(() => this.items()[0]?.link ?? '/');

  signOut(): void {
    if (this.area() !== 'system') {
      this.switcher.signOut();
      return;
    }
    this.systemSession.clear();
    void this.router.navigateByUrl('/sistema/entrar');
  }

  count(value: number): string {
    return value > 99 ? '99+' : String(value);
  }

  unreadLabel(value: number): string {
    return value === 1 ? '1 não lida' : `${value} não lidas`;
  }

  readonly bottomItems = computed(() => bottomNavItems(this.items()));

  // Na sidebar a ação principal vem primeiro.
  readonly sidebarItems = computed(() => [
    ...this.items().filter((item) => item.primary),
    ...this.items().filter((item) => !item.primary)
  ]);
}
