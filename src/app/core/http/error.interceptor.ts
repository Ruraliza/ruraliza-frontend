import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ToastService } from '../toast/toast.service';
import { toApiError } from './api-error';

// Traduz erros HTTP em ApiError, avisa via toast e repassa o erro:
// o componente decide o estado da tela (não engolimos nada aqui).
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toast = inject(ToastService);

  return next(req).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse)) {
        return throwError(() => error);
      }
      const apiError = toApiError(error);
      toast.error(apiError.message);
      return throwError(() => apiError);
    })
  );
};
