import { Component, DestroyRef, ElementRef, PLATFORM_ID, afterRenderEffect, computed, effect, inject, input, signal, untracked, viewChild } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { ChatService } from '@core/api/chat.service';
import { LiveUpdatesService } from '@core/api/live-updates.service';
import { ConnectivityService } from '@core/pwa/connectivity.service';
import { ToastService } from '@core/toast/toast.service';
import { UserRole } from '@core/models/auth.model';
import { ChatDetail, ChatMessage, ChatPerson } from '@core/models/chat.model';
import { RemoteData } from '../../utils/remote-data';
import { formatDate } from '../../utils/format';
import { ConfirmDialog } from '../../ui/confirm-dialog';
import { ErrorState } from '../../ui/error-state';
import { Icon } from '../../ui/icon';
import { Skeleton } from '../../ui/skeleton';
import { Avatar } from './avatar';
import { ChatPhonePanel } from './chat-phone-panel';
import { ReportDialog, ReportTarget } from './report-dialog';
import { QUICK_REPLIES, dayKey, dayLabel, hasContact, messageTime } from '../utils/chat';

// Mensagem ainda no caminho (ou que não saiu): aparece na hora, com o estado embaixo.
interface Outgoing {
  key: number;
  body: string;
  status: 'sending' | 'failed';
}

type Row = { kind: 'day'; key: string; label: string } | { kind: 'message'; key: string; message: ChatMessage };

const MAX_MESSAGE = 1000;
let nextKey = 0;

// A conversa de um serviço. A lista se atualiza sozinha (SSE); abrir marca como lida.
// No topo fica o WhatsApp (app-chat-phone-panel): protegido até os dois liberarem. Sem sinal, a
// mensagem fica como "Não enviada" e um toque reenvia.
@Component({
  selector: 'app-chat-thread',
  imports: [RouterLink, Avatar, ChatPhonePanel, ConfirmDialog, ErrorState, Icon, ReportDialog, Skeleton],
  template: `
    <div class="container thread">
      <a class="back-link" [routerLink]="listLink()">← Conversas</a>

      @switch (chat.state().status) {
        @case ('loading') { <app-skeleton [count]="3" [height]="72" /> }
        @case ('error') { <app-error-state [message]="chat.error()" (retry)="chat.load()" /> }
        @case ('success') {
          @if (chat.data(); as c) {
            <header class="who">
              <app-avatar [name]="other().name" [photoUrl]="other().photo_url" [size]="48" />
              <div>
                <h1>{{ other().name }}</h1>
                <a class="service t-body-sm" [routerLink]="serviceLink()">{{ c.service_name }}</a>
              </div>
              <button type="button" class="report t-body-sm" (click)="reporting.set(reportTarget())"><app-icon name="flag" [size]="16" />Denunciar</button>
            </header>

            <app-chat-phone-panel [chat]="c" [role]="role()" [busy]="sharing()" (shareRequested)="confirmingShare.set(true)" (unshareRequested)="share(false)" />

            <ol class="messages" role="list" aria-live="polite" aria-relevant="additions">
              @for (row of rows(); track row.key) {
                @if (row.kind === 'day') {
                  <li class="day"><span>{{ row.label }}</span></li>
                } @else {
                  @let m = row.message;
                  <li [class]="'msg ' + side(m)">
                    @if (m.sender === 'system') {
                      <p class="system">{{ m.body }}</p>
                    } @else {
                      <p class="bubble"><span class="visually-hidden">{{ side(m) === 'mine' ? 'Você' : otherFirst() }}: </span>{{ m.body }}</p>
                      <time [attr.datetime]="m.insertion_date">{{ time(m.insertion_date) }}</time>
                    }
                  </li>
                }
              }
              @for (out of outgoing(); track out.key) {
                <li class="msg mine">
                  <p class="bubble" [class.failed]="out.status === 'failed'">{{ out.body }}</p>
                  @if (out.status === 'sending') {
                    <span class="state t-body-sm">Enviando…</span>
                  } @else {
                    <button type="button" class="retry t-body-sm" (click)="retry(out)"><app-icon name="refresh" [size]="16" />Não enviada. Tocar para reenviar</button>
                  }
                </li>
              }
            </ol>

            @if (c.open) {
              <form class="composer" (submit)="submit($event)">
                @if (!draft().trim()) {
                  <div class="quick" role="group" aria-label="Respostas rápidas">
                    @for (reply of quickReplies(); track reply) {
                      <button type="button" (click)="useReply(reply)">{{ reply }}</button>
                    }
                  </div>
                }
                @if (contactWarning()) {
                  <p class="warn t-body-sm" role="status"><app-icon name="lock" [size]="16" />Telefone e e-mail aparecem como "oculto" até vocês dois liberarem o WhatsApp.</p>
                }
                <div class="write">
                  <label class="visually-hidden" for="chat-message">Mensagem para {{ otherFirst() }}</label>
                  <textarea #box id="chat-message" rows="1" enterkeyhint="send" [maxLength]="maxMessage" placeholder="Escreva uma mensagem"
                    [value]="draft()" (input)="onInput($event)" (keydown.enter)="onEnter($event)"></textarea>
                  <button class="send" type="submit" [disabled]="!draft().trim()" aria-label="Enviar mensagem"><app-icon name="send" [size]="22" /></button>
                </div>
              </form>
            } @else {
              <p class="closed" role="status"><app-icon name="lock" [size]="18" />{{ closedText() }}</p>
            }
          }
        }
      }
    </div>

    <app-confirm-dialog
      [open]="confirmingShare()"
      title="Liberar seu WhatsApp?"
      [message]="shareMessage()"
      confirmLabel="Liberar WhatsApp"
      [loading]="sharing()"
      (confirmed)="share(true)"
      (cancelled)="confirmingShare.set(false)"
    />

    <app-report-dialog [role]="role()" [target]="reporting()" (closed)="reporting.set(null)" />
  `,
  styleUrl: './chat-thread.css'
})
export class ChatThread {
  readonly chatId = input.required<number>();
  readonly role = input.required<UserRole>();

  private readonly chatService = inject(ChatService);
  private readonly live = inject(LiveUpdatesService);
  private readonly toast = inject(ToastService);
  private readonly connectivity = inject(ConnectivityService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly box = viewChild<ElementRef<HTMLTextAreaElement>>('box');

  readonly chat = new RemoteData<ChatDetail>(() => this.chatService.get(this.chatId()));
  readonly outgoing = signal<Outgoing[]>([]);
  readonly draft = signal('');
  readonly confirmingShare = signal(false);
  readonly sharing = signal(false);
  readonly maxMessage = MAX_MESSAGE;
  readonly time = messageTime;

  readonly other = computed<ChatPerson>(() => {
    const c = this.chat.data();
    if (!c) return { name: '', photo_url: null, phone: null };
    return this.role() === 'farmer' ? c.worker : c.farmer;
  });
  readonly otherFirst = computed(() => this.other().name.split(' ')[0] ?? '');
  // Denúncia da outra parte: o produtor denuncia o trabalhador; o trabalhador, o produtor.
  readonly reporting = signal<ReportTarget | null>(null);
  readonly reportTarget = computed<ReportTarget | null>(() => {
    const c = this.chat.data();
    if (!c) return null;
    return this.role() === 'farmer'
      ? { type: 'worker', id: c.worker_id, name: c.worker.name }
      : { type: 'farmer', id: c.farmer_id, name: c.farmer.name };
  });
  readonly bothShare = computed(() => {
    const c = this.chat.data();
    return !!c && c.farmer_shares_phone && c.worker_shares_phone;
  });
  readonly shareMessage = computed(() =>
    `${this.otherFirst()} vai ver o seu número quando também liberar o WhatsApp. Você pode deixar de compartilhar depois.`
  );

  readonly listLink = computed(() => (this.role() === 'farmer' ? '/produtor/conversas' : '/trabalhador/conversas'));
  readonly serviceLink = computed(() => {
    const id = this.chat.data()?.service_id;
    return this.role() === 'farmer' ? ['/produtor/servicos', id] : ['/trabalhador/vagas', id];
  });
  readonly quickReplies = computed(() => QUICK_REPLIES[this.role()]);
  readonly contactWarning = computed(() => !this.bothShare() && hasContact(this.draft()));
  readonly closedText = computed(() => {
    const c = this.chat.data();
    if (!c?.closes_at) return 'Conversa encerrada.';
    return `Conversa encerrada em ${formatDate(c.closes_at)}. O histórico fica guardado aqui.`;
  });

  // Mensagens com um separador a cada dia.
  readonly rows = computed<Row[]>(() => {
    const rows: Row[] = [];
    let lastDay = '';
    for (const message of this.chat.data()?.messages ?? []) {
      const day = dayKey(message.insertion_date);
      if (day !== lastDay) {
        rows.push({ kind: 'day', key: `d${day}`, label: dayLabel(message.insertion_date) });
        lastDay = day;
      }
      rows.push({ kind: 'message', key: `m${message.id}`, message });
    }
    return rows;
  });
  private readonly messageCount = computed(() => (this.chat.data()?.messages.length ?? 0) + this.outgoing().length);

  private liveSubscription: Subscription | null = null;

  constructor() {
    // Carrega e passa a ouvir a conversa (de novo se o id mudar).
    effect(() => {
      const id = this.chatId();
      untracked(() => {
        this.outgoing.set([]);
        this.chat.load();
        this.liveSubscription?.unsubscribe();
        this.liveSubscription = this.live.chat(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.chat.refresh());
      });
    });
    // Mensagem nova na tela: marca como lida (só com a aba visível).
    effect(() => {
      const c = this.chat.data();
      if (c && c.unread > 0 && this.isBrowser && document.visibilityState === 'visible') {
        untracked(() => this.chatService.markRead(c.id).subscribe({ error: () => undefined }));
      }
    });
    // Rola até a última mensagem quando chega ou sai uma.
    afterRenderEffect(() => {
      if (this.messageCount() > 0 && this.isBrowser) window.scrollTo({ top: document.documentElement.scrollHeight });
    });
  }

  side(message: ChatMessage): 'mine' | 'theirs' | 'system' {
    if (message.sender === 'system') return 'system';
    return message.sender === this.role() ? 'mine' : 'theirs';
  }

  onInput(event: Event): void {
    const box = event.target as HTMLTextAreaElement;
    this.draft.set(box.value);
    this.autosize(box);
  }

  // Enter envia; Shift+Enter quebra a linha.
  onEnter(event: Event): void {
    if ((event as KeyboardEvent).shiftKey) return;
    event.preventDefault();
    this.send();
  }

  useReply(reply: string): void {
    this.draft.set(reply);
    const box = this.box()?.nativeElement;
    if (box) {
      box.value = reply;
      box.focus();
      this.autosize(box);
    }
  }

  submit(event: Event): void {
    event.preventDefault();
    this.send();
  }

  // O sinal voltou: reenvia sozinho as mensagens que não saíram (modo sem internet).
  private retryFailedWhenOnline = effect(() => {
    if (!this.connectivity.online()) return;
    untracked(() => {
      for (const out of this.outgoing().filter((o) => o.status === 'failed')) this.retry(out);
    });
  });

  retry(out: Outgoing): void {
    this.outgoing.update((list) => list.filter((o) => o.key !== out.key));
    this.deliver(out.body);
  }

  share(share: boolean): void {
    const c = this.chat.data();
    if (!c) return;
    this.sharing.set(true);
    this.chatService.sharePhone(c.id, share).subscribe({
      next: () => {
        this.sharing.set(false);
        this.confirmingShare.set(false);
        this.chat.refresh();
      },
      error: () => {
        this.sharing.set(false);
        this.confirmingShare.set(false);
      }
    });
  }

  private send(): void {
    const body = this.draft().trim();
    if (!body) return;
    this.draft.set('');
    const box = this.box()?.nativeElement;
    if (box) {
      box.value = '';
      this.autosize(box);
    }
    this.deliver(body);
  }

  private deliver(body: string): void {
    const c = this.chat.data();
    if (!c) return;
    const key = nextKey++;
    this.outgoing.update((list) => [...list, { key, body, status: 'sending' }]);
    this.chatService.send(c.id, body).subscribe({
      next: ({ sent, masked }) => {
        // A mensagem enviada entra no lugar da provisória (o aviso em tempo real também recarrega).
        this.outgoing.update((list) => list.filter((o) => o.key !== key));
        const current = this.chat.data();
        if (current && !current.messages.some((m) => m.id === sent.id)) {
          this.chat.replace({ ...current, messages: [...current.messages, sent], last_message: sent });
        }
        if (masked) this.toast.info('O número ou e-mail foi ocultado. Use "Liberar meu WhatsApp" para trocar contato.');
      },
      error: () => this.outgoing.update((list) => list.map((o) => (o.key === key ? { ...o, status: 'failed' } : o)))
    });
  }

  // Cresce até 5 linhas; depois rola por dentro.
  private autosize(box: HTMLTextAreaElement): void {
    box.style.height = 'auto';
    box.style.height = `${Math.min(box.scrollHeight, 5 * 24 + 24)}px`;
  }
}
