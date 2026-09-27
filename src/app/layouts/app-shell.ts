import { Component, computed, inject, input } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CurrentUserService } from '../core/session/current-user.service';
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
// ou sidebar (>= 1024px) com os mesmos itens.
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
        <button type="button" class="switch" (click)="switchProfile()"><app-icon name="logout" />Trocar perfil de teste</button>
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

  private readonly currentUser = inject(CurrentUserService);
  private readonly router = inject(Router);

  // Na sidebar a ação principal vem primeiro.
  readonly sidebarItems = computed(() => [
    ...this.items().filter((item) => item.primary),
    ...this.items().filter((item) => !item.primary)
  ]);

  switchProfile(): void {
    this.currentUser.clear();
    this.router.navigateByUrl('/entrar');
  }
}
