import { ApplicationConfig, isDevMode, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding, withInMemoryScrolling } from '@angular/router';
import { provideClientHydration, withEventReplay, withIncrementalHydration } from '@angular/platform-browser';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideServiceWorker } from '@angular/service-worker';
import { routes } from './app.routes';
import { authInterceptor } from '@core/http/auth.interceptor';
import { errorInterceptor } from '@core/http/error.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      withComponentInputBinding(),
      withInMemoryScrolling({ anchorScrolling: 'enabled', scrollPositionRestoration: 'enabled' })
    ),
    provideClientHydration(withEventReplay(), withIncrementalHydration()),
    // errorInterceptor por fora: o authInterceptor ainda vê o HttpErrorResponse (e o cabeçalho do 401 de sessão).
    provideHttpClient(withFetch(), withInterceptors([errorInterceptor, authInterceptor])),
    // PWA: cache do app (ngsw-config.json), aviso de versão nova e push. Só no build de produção.
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000'
    })
  ]
};
