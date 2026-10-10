import { Injectable, PLATFORM_ID, computed, effect, inject, signal, untracked } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { toSignal } from '@angular/core/rxjs-interop';
import { SwPush } from '@angular/service-worker';
import { NEVER, firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PushConfig, PushSubscriptionInput } from '../../../models/push.model';
import { AccountService } from '../api/account.service';
import { CurrentUserService } from '../session/current-user.service';
import { ToastService } from '../toast/toast.service';

export type PushState = 'unsupported' | 'denied' | 'off' | 'on';

function toInput(subscription: PushSubscription): PushSubscriptionInput {
  const { endpoint, keys } = subscription.toJSON();
  return { endpoint: endpoint ?? subscription.endpoint, keys: { p256dh: keys?.['p256dh'] ?? '', auth: keys?.['auth'] ?? '' } };
}

// Notificações push (candidaturas, aceites, pagamentos), mesmo com o app fechado.
// A inscrição é do navegador (SwPush) e fica guardada na conta, no backend. O backend ainda guarda
// tudo em memória, então sempre que há conta aberta e inscrição ativa ela é reenviada (`sync`).
// O clique na notificação é tratado pelo service worker do Angular (abre o app na tela indicada).
@Injectable({ providedIn: 'root' })
export class PushService {
  private readonly http = inject(HttpClient);
  private readonly accounts = inject(AccountService);
  private readonly currentUser = inject(CurrentUserService);
  private readonly toast = inject(ToastService);

  // null = push indisponível: no servidor (SSR), em `ng serve`, sem provideServiceWorker (testes)
  // ou em navegador sem Notification (iPhone fora do app instalado).
  private readonly swPush = this.availableSwPush();
  private readonly permission = signal<NotificationPermission>(this.swPush ? Notification.permission : 'default');
  private readonly subscription = toSignal(this.swPush?.subscription ?? NEVER, { initialValue: null });
  private lastSynced: string | null = null;

  readonly busy = signal(false);
  readonly state = computed<PushState>(() => {
    if (!this.swPush) return 'unsupported';
    if (this.permission() === 'denied') return 'denied';
    return this.subscription() ? 'on' : 'off';
  });

  constructor() {
    if (!this.swPush) return;
    effect(() => {
      const accountId = this.currentUser.user()?.account_id;
      const subscription = this.subscription();
      if (accountId !== undefined && subscription) untracked(() => this.sync(accountId, subscription));
    });
  }

  async enable(): Promise<void> {
    const swPush = this.swPush;
    const user = this.currentUser.user();
    if (!swPush || !user || this.busy()) return;

    this.busy.set(true);
    try {
      const subscription = await this.requestSubscription(swPush);
      if (!subscription) return;

      this.lastSynced = `${user.account_id}|${subscription.endpoint}`;
      try {
        await firstValueFrom(this.accounts.subscribePush(user.account_id, toInput(subscription)));
      } catch {
        // Sem a inscrição no backend, o interruptor não pode ficar ligado.
        this.lastSynced = null;
        await swPush.unsubscribe().catch(() => undefined);
        this.toast.error('Não foi possível ativar as notificações. Tente de novo.');
        return;
      }
      this.toast.success('Notificações ativadas neste aparelho.');
    } finally {
      this.permission.set(Notification.permission);
      this.busy.set(false);
    }
  }

  // Para de receber neste aparelho. Também usado ao sair da conta, para o próximo a entrar
  // no mesmo aparelho não receber as notificações desta conta.
  async disable(): Promise<void> {
    const swPush = this.swPush;
    const subscription = this.subscription();
    if (!swPush || !subscription) return;

    const user = this.currentUser.user();
    this.busy.set(true);
    this.lastSynced = null;
    try {
      await swPush.unsubscribe();
      if (user) await firstValueFrom(this.accounts.unsubscribePush(user.account_id, { endpoint: subscription.endpoint }));
    } catch {
      // Sem a inscrição no navegador, o backend apaga a dele no próximo envio (410).
    } finally {
      this.busy.set(false);
    }
  }

  // Chave do backend + permissão do navegador. null (com o toast já mostrado) se não deu.
  private async requestSubscription(swPush: SwPush): Promise<PushSubscription | null> {
    let config: PushConfig;
    try {
      config = await firstValueFrom(this.http.get<PushConfig>(`${environment.apiUrl}/config/push`));
    } catch {
      return null; // o interceptor já mostrou o erro
    }
    try {
      return await swPush.requestSubscription({ serverPublicKey: config.public_key });
    } catch {
      this.toast.error(
        Notification.permission === 'denied'
          ? 'As notificações estão bloqueadas. Libere nas configurações do navegador para este site.'
          : 'Não foi possível ativar as notificações. Tente de novo.'
      );
      return null;
    }
  }

  private availableSwPush(): SwPush | null {
    const swPush = inject(SwPush, { optional: true });
    const usable = isPlatformBrowser(inject(PLATFORM_ID)) && swPush?.isEnabled && typeof Notification !== 'undefined';
    return usable ? swPush : null;
  }

  private sync(accountId: number, subscription: PushSubscription): void {
    const key = `${accountId}|${subscription.endpoint}`;
    if (this.lastSynced === key) return;
    this.lastSynced = key;
    this.accounts.subscribePush(accountId, toInput(subscription)).subscribe({
      error: () => (this.lastSynced = null) // tenta de novo na próxima troca de conta/abertura
    });
  }
}
