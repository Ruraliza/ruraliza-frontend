import { Injectable, PLATFORM_ID, effect, inject, signal, untracked } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '@env/environment';
import { CurrentUserService } from '../session/current-user.service';

const CACHE_NAME = 'ruraliza-offline-v1';
const OWNER_KEY = 'ruraliza.offlineOwner';

// O que vale guardar para ler sem sinal: perfis, serviços, candidatos, vagas, conversas, avisos, trilhas e
// a ajuda. Nunca: streams (events/live), a área do sistema, login, documentos e anúncios.
const CACHEABLE = ['/farmers/', '/workers/', '/chats/', '/reviews/', '/categories', '/help'];
const NEVER = [/\/events(\?|$)/, /\/live(\?|$)/, /\/verification(\?|$)/];

export interface CachedBody {
  body: unknown;
  savedAt: string; // ISO 8601
}

// Modo sem internet (issue #15): guarda, no aparelho, a última resposta de cada tela que a pessoa abriu
// (Cache Storage do navegador) e devolve essa cópia quando a rede falha. Ao sair da conta, ou quando
// entra outra conta, tudo é apagado: no celular dividido, ninguém lê o que era de outra pessoa.
@Injectable({ providedIn: 'root' })
export class OfflineCacheService {
  private readonly enabled = isPlatformBrowser(inject(PLATFORM_ID)) && typeof caches !== 'undefined';
  // Quando a tela mostrou dados salvos pela última vez (null: tudo veio da rede).
  readonly servedSavedAt = signal<string | null>(null);

  constructor() {
    if (!this.enabled) return;
    const currentUser = inject(CurrentUserService);
    effect(() => {
      const accountId = currentUser.user()?.account_id ?? null;
      untracked(() => void this.claim(accountId));
    });
    window.addEventListener('online', () => this.servedSavedAt.set(null));
  }

  isCacheable(method: string, url: string): boolean {
    if (!this.enabled || method !== 'GET' || !url.startsWith(environment.apiUrl)) return false;
    const path = url.slice(environment.apiUrl.length);
    return CACHEABLE.some((prefix) => path.startsWith(prefix)) && !NEVER.some((pattern) => pattern.test(path));
  }

  async save(url: string, body: unknown): Promise<void> {
    if (!this.enabled) return;
    try {
      const cache = await caches.open(CACHE_NAME);
      const saved: CachedBody = { body, savedAt: new Date().toISOString() };
      await cache.put(url, new Response(JSON.stringify(saved), { headers: { 'Content-Type': 'application/json' } }));
    } catch {
      // Sem espaço ou sem permissão: o app continua, só não fica a cópia.
    }
  }

  async load(url: string): Promise<CachedBody | undefined> {
    if (!this.enabled) return undefined;
    try {
      const response = await (await caches.open(CACHE_NAME)).match(url);
      if (!response) return undefined;
      const saved = (await response.json()) as CachedBody;
      this.servedSavedAt.set(saved.savedAt);
      return saved;
    } catch {
      return undefined;
    }
  }

  async clear(): Promise<void> {
    if (!this.enabled) return;
    try {
      await caches.delete(CACHE_NAME);
    } catch {
      // nada a fazer
    }
  }

  // A cópia é de uma conta só: saiu (null) ou entrou outra, apaga.
  private async claim(accountId: number | null): Promise<void> {
    let owner: string | null;
    try {
      owner = localStorage.getItem(OWNER_KEY);
    } catch {
      owner = null;
    }
    const next = accountId === null ? null : String(accountId);
    if (owner === next) return;
    await this.clear();
    try {
      if (next === null) localStorage.removeItem(OWNER_KEY);
      else localStorage.setItem(OWNER_KEY, next);
    } catch {
      // armazenamento bloqueado: só não lembra o dono
    }
  }
}
