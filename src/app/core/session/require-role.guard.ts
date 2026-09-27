import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { CurrentUserService, UserRole } from './current-user.service';

// ATENÇÃO: isto NÃO é segurança. Só evita abrir a área de um perfil sem ter
// escolhido um perfil de teste. Qualquer pessoa consegue chamar a API direto.
export function requireRole(role: UserRole): CanActivateFn {
  return () => {
    const currentUser = inject(CurrentUserService);
    const router = inject(Router);
    return currentUser.role() === role ? true : router.createUrlTree(['/entrar']);
  };
}
