import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

// Evento do Chrome/Edge/Android que permite abrir o "Instalar app" pelo nosso botão.
// Ainda não está nos tipos do DOM do TypeScript.
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// Instalação do app (PWA). No Chrome/Edge/Android o navegador oferece o prompt (`canInstall`);
// no iPhone/iPad não há prompt, só "Compartilhar → Adicionar à Tela de Início" (`showIosHint`).
// Já instalado (aberto como app), nenhum dos dois aparece.
@Injectable({ providedIn: 'root' })
export class InstallPromptService {
  private readonly deferred = signal<BeforeInstallPromptEvent | null>(null);
  private readonly standalone = signal(false);
  private readonly ios = signal(false);

  readonly canInstall = computed(() => this.deferred() !== null);
  readonly showIosHint = computed(() => this.ios() && !this.standalone());

  constructor() {
    if (!isPlatformBrowser(inject(PLATFORM_ID))) return;

    const iosStandalone = (navigator as Navigator & { standalone?: boolean }).standalone === true;
    this.standalone.set(iosStandalone);
    if (typeof window.matchMedia === 'function') {
      const standaloneQuery = window.matchMedia('(display-mode: standalone)');
      this.standalone.set(standaloneQuery.matches || iosStandalone);
      standaloneQuery.addEventListener('change', (e) => this.standalone.set(e.matches));
    }
    // iPadOS se apresenta como Mac; o toque denuncia.
    this.ios.set(/iphone|ipad|ipod/i.test(navigator.userAgent) || (/macintosh/i.test(navigator.userAgent) && navigator.maxTouchPoints > 1));

    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault(); // guarda para o nosso botão em vez da mini-barra do navegador
      this.deferred.set(event as BeforeInstallPromptEvent);
    });
    window.addEventListener('appinstalled', () => this.deferred.set(null));
  }

  async install(): Promise<void> {
    const event = this.deferred();
    if (!event) return;
    this.deferred.set(null); // o prompt só pode ser usado uma vez
    await event.prompt();
    await event.userChoice;
  }
}
