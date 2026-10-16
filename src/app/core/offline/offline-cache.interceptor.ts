import { HttpErrorResponse, HttpHeaders, HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, from, of, switchMap, tap, throwError } from 'rxjs';
import { OfflineCacheService } from './offline-cache.service';

// Cabeçalho da resposta que veio da cópia do aparelho, com quando ela foi salva.
export const OFFLINE_SAVED_AT_HEADER = 'X-Ruraliza-Offline-Saved-At';

// Modo sem internet: guarda as respostas das telas e, quando a rede falha (status 0), devolve a última
// cópia salva no lugar do erro. Fica por dentro dos outros interceptors: o de erro nem vê a falha.
export const offlineCacheInterceptor: HttpInterceptorFn = (req, next) => {
  const cache = inject(OfflineCacheService);
  if (!cache.isCacheable(req.method, req.urlWithParams)) return next(req);
  const url = req.urlWithParams;

  return next(req).pipe(
    tap((event) => {
      if (event instanceof HttpResponse && event.ok) void cache.save(url, event.body);
    }),
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse) || error.status !== 0) return throwError(() => error);
      return from(cache.load(url)).pipe(
        switchMap((saved) => saved === undefined
          ? throwError(() => error)
          : of(new HttpResponse({ status: 200, url, body: saved.body, headers: new HttpHeaders({ [OFFLINE_SAVED_AT_HEADER]: saved.savedAt }) })))
      );
    })
  );
};
