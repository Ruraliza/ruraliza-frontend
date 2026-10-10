import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { CurrentUserService, UserRole } from './current-user.service';

// ATENÇÃO: isto NÃO é segurança. Só evita abrir a área de um perfil sem ter
// entrado com e-mail e senha. A API ainda não tem token de sessão: qualquer pessoa consegue chamá-la direto.
export function requireRole(role: UserRole): CanActivateFn {
  return () => {
    const currentUser = inject(CurrentUserService);
    const router = inject(Router);
    return currentUser.role() === role ? true : router.createUrlTree(['/entrar']);
  };
}
