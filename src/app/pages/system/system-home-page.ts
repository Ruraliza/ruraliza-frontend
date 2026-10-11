import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { SystemAuthService } from '../../core/api/system-auth.service';
import { SYSTEM_ROLE_LABEL, SystemSessionService } from '../../core/session/system-session.service';
import { Button } from '../../shared/ui/button';
import { Icon } from '../../shared/ui/icon';

// Início da área de sistema: o que o cargo pode fazer. No mobile, também é onde fica o "Sair".
@Component({
  selector: 'app-system-home-page',
  imports: [RouterLink, Button, Icon],
  template: `
    <div class="container page">
      @if (session.user(); as user) {
        <div class="page-header">
          <div>
            <p class="t-overline muted">{{ roleLabel[user.role] }}</p>
            <h1>Olá, {{ user.name }}</h1>
          </div>
        </div>

        <ul class="grid-cards" role="list">
          @if (session.can('users:manage')) {
            <li class="card stack-sm">
              <h2 class="t-h3">Usuários do app</h2>
              <p class="muted">Veja as contas de produtores e trabalhadores, edite dados e remova perfis ou contas.</p>
              <div><a appButton variant="secondary" routerLink="/sistema/usuarios">Ver usuários</a></div>
            </li>
          }
          @if (session.can('system-users:manage')) {
            <li class="card stack-sm">
              <h2 class="t-h3">Equipe</h2>
              <p class="muted">Cadastre administradores e tutores. Usuários de sistema não se cadastram pelo app.</p>
              <div class="cluster">
                <a appButton variant="secondary" routerLink="/sistema/equipe">Ver equipe</a>
                <a appButton variant="ghost" routerLink="/sistema/equipe/novo">Novo membro</a>
              </div>
            </li>
          }
          @if (session.can('tracks:manage')) {
            <li class="card stack-sm">
              <h2 class="t-h3">Trilhas de estudo</h2>
              <p class="muted">Em breve: cadastrar e editar as trilhas de qualificação dos trabalhadores.</p>
            </li>
          }
        </ul>
      }

      <div class="cluster">
        <button appButton variant="secondary" type="button" (click)="signOut()"><app-icon name="logout" [size]="20" />Sair</button>
      </div>
    </div>
  `
})
export class SystemHomePage {
  protected readonly session = inject(SystemSessionService);
  private readonly auth = inject(SystemAuthService);
  private readonly router = inject(Router);
  readonly roleLabel = SYSTEM_ROLE_LABEL;

  constructor() {
    // Atualiza nome e cargo (podem ter mudado desde o login). Sessão vencida: o authInterceptor leva ao login.
    this.auth.me().subscribe({ next: (user) => this.session.update(user), error: () => undefined });
  }

  signOut(): void {
    this.session.clear();
    void this.router.navigateByUrl('/sistema/entrar');
  }
}
