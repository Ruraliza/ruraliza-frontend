import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

// Se o aparelho está com internet (pelo navegador). Sem conexão, o app abre do cache,
// mas as chamadas à API falham: a faixa de offline explica o porquê.
@Injectable({ providedIn: 'root' })
export class ConnectivityService {
  readonly online = signal(true);

  constructor() {
    if (!isPlatformBrowser(inject(PLATFORM_ID))) return;

    this.online.set(navigator.onLine);
    window.addEventListener('online', () => this.online.set(true));
    window.addEventListener('offline', () => this.online.set(false));
  }
}
