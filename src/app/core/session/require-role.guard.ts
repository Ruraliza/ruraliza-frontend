import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { CurrentUserService, UserRole } from './current-user.service';
import { newProfileUrl } from './roles';

// ATENÇÃO: isto NÃO é segurança. Só evita abrir a área de um perfil sem ter
// entrado com e-mail e senha. Quem protege os dados é a API (token de sessão + dono do recurso).
//
// Conta com os dois perfis abrindo um link do outro painel: troca o painel nesta aba.
// Conta sem esse perfil: vai para a página que cria o perfil.
export function requireRole(role: UserRole): CanActivateFn {
  return () => {
    const currentUser = inject(CurrentUserService);
    const router = inject(Router);
    if (!currentUser.user()) return router.createUrlTree(['/entrar']);
    if (currentUser.role() === role) return true;
    if (!currentUser.hasProfile(role)) return router.createUrlTree([newProfileUrl(role)]);

    currentUser.activate(role);
    return true;
  };
}

// Qualquer conta que entrou (páginas da conta, fora dos painéis).
export const requireSignedIn: CanActivateFn = () => {
  const currentUser = inject(CurrentUserService);
  return currentUser.user() ? true : inject(Router).createUrlTree(['/entrar']);
};
