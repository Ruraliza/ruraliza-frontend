import { HttpContextToken, HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ToastService } from '../toast/toast.service';
import { toApiError } from './api-error';

// Pedidos feitos em segundo plano, sem a pessoa ter pedido nada: o erro não vira toast.
// Uso: http.post(url, body, { context: new HttpContext().set(SILENT_ERRORS, true) })
export const SILENT_ERRORS = new HttpContextToken<boolean>(() => false);

// Traduz erros HTTP em ApiError, avisa via toast (exceto SILENT_ERRORS) e repassa o erro:
// o componente decide o estado da tela (não engolimos nada aqui).
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toast = inject(ToastService);

  return next(req).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse)) {
        return throwError(() => error);
      }
      const apiError = toApiError(error);
      if (!req.context.get(SILENT_ERRORS)) toast.error(apiError.message);
      return throwError(() => apiError);
    })
  );
};
