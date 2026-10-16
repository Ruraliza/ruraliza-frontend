import { Injectable, PLATFORM_ID, computed, effect, inject, signal, untracked } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpContext } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ApiError } from '../http/api-error';
import { SILENT_ERRORS } from '../http/error.interceptor';
import { CurrentUserService } from '../session/current-user.service';
import { ToastService } from '../toast/toast.service';

const STORAGE_KEY = 'ruraliza.offlineQueue';

// Uma ação feita sem sinal, para enviar quando a conexão voltar. Só entram ações que podem ser repetidas
// sem efeito duplo (ex.: marcar uma aula como concluída).
export interface QueuedAction {
  id: string;
  accountId: number;
  method: 'PUT';
  url: string;
  label: string; // o que a pessoa fez, para os avisos ("a aula Derriça no pano")
  queuedAt: string;
}

// Fila do modo sem internet (issue #15): guarda no aparelho e envia na ordem quando o sinal volta (e ao abrir
// o app com sinal). Erro da API (a ação não vale mais) tira da fila e avisa; falta de rede espera a próxima vez.
@Injectable({ providedIn: 'root' })
export class OfflineQueueService {
  private readonly http = inject(HttpClient);
  private readonly toast = inject(ToastService);
  private readonly currentUser = inject(CurrentUserService);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly queue = signal<QueuedAction[]>(this.restore());
  private flushing = false;

  // Quantas ações da conta aberta esperam a internet.
  readonly pending = computed(() => {
    const accountId = this.currentUser.user()?.account_id;
    return this.queue().filter((a) => a.accountId === accountId).length;
  });

  constructor() {
    if (!this.isBrowser) return;
    window.addEventListener('online', () => void this.flush());
    // Ao entrar (ou abrir o app com a sessão), envia o que ficou guardado.
    effect(() => {
      if (this.currentUser.user()) untracked(() => void this.flush());
    });
  }

  enqueue(action: Omit<QueuedAction, 'id' | 'accountId' | 'queuedAt'>): void {
    const accountId = this.currentUser.user()?.account_id;
    if (accountId === undefined) return;
    const queued: QueuedAction = { ...action, accountId, id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, queuedAt: new Date().toISOString() };
    this.update([...this.queue().filter((a) => !(a.accountId === accountId && a.url === action.url && a.method === action.method)), queued]);
  }

  async flush(): Promise<void> {
    const accountId = this.currentUser.user()?.account_id;
    if (this.flushing || accountId === undefined || (typeof navigator !== 'undefined' && !navigator.onLine)) return;
    this.flushing = true;
    let sent = 0;
    try {
      for (const action of this.queue().filter((a) => a.accountId === accountId)) {
        try {
          await firstValueFrom(this.http.request(action.method, action.url, { context: new HttpContext().set(SILENT_ERRORS, true) }));
          sent++;
          this.remove(action.id);
        } catch (error) {
          if (error instanceof ApiError && error.status === 0) break; // sem rede: tenta de novo depois
          this.remove(action.id);
          const reason = (error instanceof ApiError ? error.message : 'erro inesperado').replace(/\.$/, '');
          this.toast.error(`Não foi possível enviar ${action.label}: ${reason}.`);
        }
      }
    } finally {
      this.flushing = false;
    }
    if (sent > 0) this.toast.success(sent === 1 ? 'A ação feita sem internet foi enviada.' : `As ${sent} ações feitas sem internet foram enviadas.`);
  }

  private remove(id: string): void {
    this.update(this.queue().filter((a) => a.id !== id));
  }

  private update(queue: QueuedAction[]): void {
    this.queue.set(queue);
    if (!this.isBrowser) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
    } catch {
      // armazenamento cheio ou bloqueado: a fila vale só nesta aba
    }
  }

  private restore(): QueuedAction[] {
    if (!this.isBrowser) return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed: unknown = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? (parsed as QueuedAction[]) : [];
    } catch {
      return [];
    }
  }
}
