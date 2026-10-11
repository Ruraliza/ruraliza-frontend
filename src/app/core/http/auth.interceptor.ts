import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { environment } from '@env/environment';
import { CurrentUserService } from '../session/current-user.service';
import { SystemSessionService } from '../session/system-session.service';

// Rotas da equipe (usuários de sistema): vão com o token da sessão de sistema; as demais, com o da conta.
const SYSTEM_PATHS = [`${environment.apiUrl}/admin`, `${environment.apiUrl}/auth/system/`];

function isSystemRequest(req: HttpRequest<unknown>): boolean {
  return SYSTEM_PATHS.some((path) => req.url.startsWith(path));
}

// A API marca com `WWW-Authenticate: Bearer` o 401 de sessão (sem token, inválido ou vencido).
// O 401 de senha errada (login, troca de senha) não tem o cabeçalho e não derruba a sessão.
function isSessionExpired(error: unknown): boolean {
  return error instanceof HttpErrorResponse && error.status === 401 && (error.headers.get('WWW-Authenticate') ?? '').startsWith('Bearer');
}

// Envia `Authorization: Bearer <token>` para a API. Sessão vencida: limpa a sessão e volta ao login
// (a mensagem da API sai no toast pelo errorInterceptor, que fica por fora deste).
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(environment.apiUrl)) return next(req);

  const currentUser = inject(CurrentUserService);
  const systemSession = inject(SystemSessionService);
  const router = inject(Router);
  const system = isSystemRequest(req);
  const token = system ? systemSession.token() : currentUser.token();

  const authorized = token && !req.headers.has('Authorization') ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(authorized).pipe(
    catchError((error: unknown) => {
      if (isSessionExpired(error)) {
        if (system) {
          systemSession.clear();
          void router.navigateByUrl('/sistema/entrar');
        } else if (currentUser.user()) {
          currentUser.clear();
          void router.navigateByUrl('/entrar');
        }
      }
      return throwError(() => error);
    })
  );
};
