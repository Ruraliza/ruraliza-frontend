import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SystemPermission, SystemSessionService } from './system-session.service';

// Como o requireRole: só evita abrir telas sem a sessão certa. Quem protege de verdade é a API (token + cargo).

// Qualquer usuário de sistema que entrou.
export const requireSystemSignedIn: CanActivateFn = () => {
  const session = inject(SystemSessionService);
  return session.user() ? true : inject(Router).createUrlTree(['/sistema/entrar']);
};

// Cargo com a permissão; sem ela, volta ao início do painel.
export function requireSystemPermission(permission: SystemPermission): CanActivateFn {
  return () => {
    const session = inject(SystemSessionService);
    const router = inject(Router);
    if (!session.user()) return router.createUrlTree(['/sistema/entrar']);
    return session.can(permission) ? true : router.createUrlTree(['/sistema']);
  };
}
