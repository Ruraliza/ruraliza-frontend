import { Component, computed, inject, input } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { UserRole } from '../core/session/current-user.service';
import { RoleSwitchService } from '../core/session/role-switch.service';
import { SystemSessionService } from '../core/session/system-session.service';
import { Icon, IconName } from '../shared/ui/icon';
import { Logo } from '../shared/ui/logo';
import { TestEnvBanner } from '../shared/ui/test-env-banner';

export interface NavItem {
  label: string;
  icon: IconName;
  link: string;
  queryParams?: Record<string, string>;
  exact?: boolean;
  primary?: boolean; // ação central: botão flutuante no mobile, primeiro item destacado na sidebar
}

// Casca das áreas logadas: banner de teste no topo, bottom nav (< 1024px)
// ou sidebar (>= 1024px) com os mesmos itens. No fim da sidebar: trocar de painel e sair
// (no mobile, os dois ficam na página de perfil). Na área de sistema não há troca de painel.
@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Icon, Logo, TestEnvBanner],
  template: `
    <a class="skip-link" href="#conteudo">Pular para o conteúdo</a>
    <app-test-env-banner class="banner" />

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
      @for (item of items(); track item.label) {
        <a
          [routerLink]="item.link"
          [queryParams]="item.queryParams"
          [class.primary]="item.primary"
          routerLinkActive="active"
          [routerLinkActiveOptions]="{ exact: !!item.exact }"
          [ariaCurrentWhenActive]="item.primary ? undefined : 'page'"
        >
          <span class="bubble"><app-icon [name]="item.icon" /></span>
          <span class="label">{{ item.label }}</span>
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

  protected readonly switcher = inject(RoleSwitchService);
  private readonly systemSession = inject(SystemSessionService);
  private readonly router = inject(Router);

  // Painel de conta do app (com troca de painel); null na área de sistema.
  readonly accountArea = computed(() => {
    const area = this.area();
    return area === 'system' ? null : area;
  });

  signOut(): void {
    if (this.area() !== 'system') {
      this.switcher.signOut();
      return;
    }
    this.systemSession.clear();
    void this.router.navigateByUrl('/sistema/entrar');
  }

  // Na sidebar a ação principal vem primeiro.
  readonly sidebarItems = computed(() => [
    ...this.items().filter((item) => item.primary),
    ...this.items().filter((item) => !item.primary)
  ]);
}
