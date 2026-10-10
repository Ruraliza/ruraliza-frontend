import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AccountService } from '../api/account.service';
import { CurrentUserService, UserRole } from './current-user.service';
import { ROLE_HOME, ROLE_LABEL, newProfileUrl, otherRole } from './roles';

// Troca de painel (produtor ↔ trabalhador) e saída da conta, usadas no menu e nas páginas de perfil.
@Injectable({ providedIn: 'root' })
export class RoleSwitchService {
  private readonly accounts = inject(AccountService);
  private readonly currentUser = inject(CurrentUserService);
  private readonly router = inject(Router);

  readonly switching = signal(false);

  // Texto do botão no painel `area`: troca direto se a conta já tem o outro perfil; senão, convida a criar.
  // Lê o usuário atual (signal), então atualiza sozinho quando a conta ganha o outro perfil.
  labelFor(area: UserRole): string {
    const target = otherRole(area);
    return this.currentUser.hasProfile(target) ? `Ir para a área do ${ROLE_LABEL[target]}` : `Quero ser ${ROLE_LABEL[target]}`;
  }

  // Sai do painel `area` para o outro.
  switchFrom(area: UserRole): void {
    this.switchTo(otherRole(area));
  }

  // Perfil que a conta já tem: abre o painel e lembra a escolha para o próximo login.
  // Perfil que ainda não existe: vai para a página que completa o cadastro (com confirmação).
  switchTo(role: UserRole): void {
    const user = this.currentUser.user();
    if (!user || this.switching()) return;
    if (!this.currentUser.hasProfile(role)) {
      this.router.navigateByUrl(newProfileUrl(role));
      return;
    }

    this.switching.set(true);
    this.accounts.setActiveRole(user.account_id, role).subscribe({
      next: ({ user: session }) => {
        this.currentUser.set(session);
        this.switching.set(false);
        this.router.navigateByUrl(ROLE_HOME[role]);
      },
      error: () => this.switching.set(false) // a mensagem já saiu no toast
    });
  }

  // Perfil excluído: se a conta tem o outro, segue nele; senão, a conta acabou e sai.
  profileRemoved(role: UserRole): void {
    const user = this.currentUser.user();
    const other = otherRole(role);
    const otherId = user?.profiles[other] ?? null;
    if (!user || otherId === null) {
      this.signOut();
      return;
    }
    this.currentUser.set({ ...user, role: other, id: otherId, profiles: { ...user.profiles, [role]: null } });
    this.router.navigateByUrl(ROLE_HOME[other]);
  }

  signOut(): void {
    this.currentUser.clear();
    this.router.navigateByUrl('/entrar');
  }
}
