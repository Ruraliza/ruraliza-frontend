import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { SwUpdate } from '@angular/service-worker';

// Versão nova publicada: o service worker baixa em segundo plano e avisa (VERSION_READY);
// a faixa de atualização pergunta antes de recarregar, para não perder um formulário pela metade.
// Com o app instalado, a janela pode ficar aberta por dias: confere de novo sempre que ele volta à tela.
@Injectable({ providedIn: 'root' })
export class AppUpdateService {
  private readonly swUpdate = inject(SwUpdate, { optional: true });
  private readonly document = inject(DOCUMENT);

  readonly updateReady = signal(false);

  constructor() {
    const swUpdate = this.swUpdate;
    if (!isPlatformBrowser(inject(PLATFORM_ID)) || !swUpdate?.isEnabled) return;

    swUpdate.versionUpdates.subscribe((event) => {
      if (event.type === 'VERSION_READY') this.updateReady.set(true);
    });
    // O cache ficou inconsistente (ex.: arquivos da versão antiga sumiram do servidor): só recarregar resolve.
    swUpdate.unrecoverable.subscribe(() => this.document.location.reload());

    this.document.addEventListener('visibilitychange', () => {
      if (this.document.visibilityState === 'visible') swUpdate.checkForUpdate().catch(() => undefined);
    });
  }

  async apply(): Promise<void> {
    await this.swUpdate?.activateUpdate();
    this.document.location.reload();
  }
}
