import { Component, computed, inject, signal } from '@angular/core';
import { AppUpdateService } from '../pwa/app-update.service';
import { ConnectivityService } from '../pwa/connectivity.service';
import { OfflineCacheService } from '../offline/offline-cache.service';
import { OfflineQueueService } from '../offline/offline-queue.service';
import { Button } from '@shared/ui/button';
import { Icon } from '@shared/ui/icon';

// Faixas do app instalável, no topo de qualquer tela (uma instância, no App):
// sem conexão (o app abre do cache, mas a API não responde) e versão nova pronta para usar.
@Component({
  selector: 'app-pwa-banners',
  imports: [Button, Icon],
  template: `
    <div role="status" aria-live="polite">
      @if (!connectivity.online()) {
        <p class="banner banner--offline">
          <app-icon name="wifi-off" [size]="18" /><span>{{ offlineText() }}</span>
        </p>
      }
      @if (connectivity.online() && queue.pending()) {
        <p class="banner banner--queue"><app-icon name="refresh" [size]="18" /><span>Enviando o que você fez sem internet…</span></p>
      }
      @if (updates.updateReady()) {
        <div class="banner banner--update">
          <app-icon name="refresh" [size]="18" /><span>Nova versão do Ruraliza disponível.</span>
          <button appButton variant="inverse" type="button" [loading]="applying()" (click)="apply()">Atualizar</button>
        </div>
      }
    </div>
  `,
  styles: `
    :host {
      position: fixed; z-index: 60; top: 0; left: 0; right: 0;
      padding-top: var(--safe-top); pointer-events: none;
    }
    .banner {
      pointer-events: auto; display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: var(--space-2);
      padding: var(--space-2) var(--space-4); font-size: 0.875rem; line-height: 1.25rem; font-weight: 600; text-align: center;
      box-shadow: var(--shadow-float);
    }
    .banner--offline { background: var(--ink); color: var(--on-dark); }
    .banner--update, .banner--queue { background: var(--mata); color: var(--on-mata); }
    .banner--update .btn { min-height: 36px; padding-block: 0; }
  `
})
export class PwaBanners {
  protected readonly connectivity = inject(ConnectivityService);
  protected readonly updates = inject(AppUpdateService);
  protected readonly applying = signal(false);
  protected readonly cache = inject(OfflineCacheService);
  protected readonly queue = inject(OfflineQueueService);
  // Sem sinal: o que a pessoa já abriu continua na tela (cópia do aparelho) e as aulas marcadas esperam.
  protected readonly offlineText = computed(() => {
    const pending = this.queue.pending();
    const waiting = pending ? ` ${pending === 1 ? '1 ação espera' : pending + ' ações esperam'} o sinal para ser enviada${pending === 1 ? '' : 's'}.` : '';
    const saved = this.cache.servedSavedAt();
    const copy = saved ? ` Mostrando o que foi salvo às ${new Date(saved).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}.` : ' O que você já abriu continua aqui.';
    return `Sem internet.${copy}${waiting}`;
  });

  protected apply(): void {
    this.applying.set(true);
    this.updates.apply().catch(() => this.applying.set(false));
  }
}
