import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ChatInboxService } from '@core/api/chat-inbox.service';
import { UserRole } from '@core/models/auth.model';
import { Chat } from '@core/models/chat.model';
import { EmptyState } from '../../ui/empty-state';
import { Icon } from '../../ui/icon';
import { Skeleton } from '../../ui/skeleton';
import { Avatar } from './avatar';
import { chatTime } from '../utils/chat';

// Lista "Conversas" de um painel: com quem, sobre qual serviço, a última mensagem e as não lidas.
@Component({
  selector: 'app-chat-list',
  imports: [RouterLink, Avatar, EmptyState, Icon, Skeleton],
  template: `
    <div class="container page">
      <div class="page-header">
        <div>
          <h1>Conversas</h1>
          <p class="muted">{{ intro() }}</p>
        </div>
      </div>

      @if (!inbox.loaded()) {
        <app-skeleton [count]="3" [height]="80" />
      } @else if (inbox.chats().length) {
        <ul class="list" role="list">
          @for (chat of inbox.chats(); track chat.id) {
            <li>
              <a class="row" [class.unread]="chat.unread > 0" [routerLink]="[base(), chat.id]">
                <app-avatar [name]="other(chat).name" [photoUrl]="other(chat).photo_url" [size]="52" />
                <span class="what">
                  <span class="line">
                    <span class="name">{{ other(chat).name }}</span>
                    @if (chat.last_message; as last) { <span class="time t-body-sm">{{ time(last.insertion_date) }}</span> }
                  </span>
                  <span class="service t-body-sm">{{ chat.service_name }}@if (!chat.open) { <span class="closed">Encerrada</span> }</span>
                  <span class="line">
                    <span class="preview t-body-sm">{{ preview(chat) }}</span>
                    @if (chat.unread > 0) {
                      <span class="badge" [attr.aria-label]="chat.unread + (chat.unread === 1 ? ' mensagem não lida' : ' mensagens não lidas')">{{ chat.unread }}</span>
                    }
                  </span>
                </span>
              </a>
            </li>
          }
        </ul>
      } @else {
        <app-empty-state icon="chat" title="Nenhuma conversa ainda" [message]="emptyMessage()">
          @if (role() === 'worker') {
            <a class="link" routerLink="/trabalhador/vagas"><app-icon name="search" [size]="18" />Ver vagas abertas</a>
          }
        </app-empty-state>
      }
    </div>
  `,
  styles: `
    .page-header p { margin: var(--space-1) 0 0; max-width: 60ch; }
    .list { display: grid; gap: var(--space-2); }
    .row {
      display: flex; align-items: center; gap: var(--space-3);
      padding: var(--space-3) var(--space-4); border-radius: var(--radius-lg);
      border: 1px solid var(--line); background: var(--surface-raised);
      color: var(--ink); text-decoration: none;
    }
    .row:hover { border-color: var(--line-strong); }
    .row.unread { border-color: var(--broto); background: var(--broto-soft); }
    .what { display: grid; gap: 2px; flex: 1; min-width: 0; }
    .line { display: flex; align-items: baseline; justify-content: space-between; gap: var(--space-2); min-width: 0; }
    .name { font-weight: 700; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .unread .name { font-weight: 800; }
    .time { flex: none; color: var(--ink-muted); font-variant-numeric: tabular-nums; }
    .service { color: var(--ink-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .closed { margin-left: var(--space-2); padding: 0 var(--space-2); border-radius: var(--radius-pill); background: var(--surface-sunken); font-weight: 600; }
    .preview { color: var(--ink-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .unread .preview { color: var(--ink); font-weight: 600; }
    .badge {
      flex: none; min-width: 24px; height: 24px; padding: 0 7px; border-radius: var(--radius-pill);
      background: var(--orange-500); color: var(--ink); font-size: 0.8125rem; font-weight: 800; line-height: 1.5rem; text-align: center;
    }
    .link { display: inline-flex; align-items: center; gap: var(--space-2); font-weight: 700; }
  `
})
export class ChatList {
  readonly role = input.required<UserRole>();

  protected readonly inbox = inject(ChatInboxService);

  readonly base = computed(() => (this.role() === 'farmer' ? '/produtor/conversas' : '/trabalhador/conversas'));
  readonly intro = computed(() =>
    this.role() === 'farmer'
      ? 'Converse com quem você contratou. O WhatsApp dos dois fica protegido até vocês decidirem trocar.'
      : 'Converse com os produtores que aceitaram você. O WhatsApp dos dois fica protegido até vocês decidirem trocar.'
  );
  readonly emptyMessage = computed(() =>
    this.role() === 'farmer'
      ? 'A conversa com o trabalhador abre quando você aceita uma candidatura.'
      : 'A conversa com o produtor abre quando ele aceita a sua candidatura.'
  );
  readonly time = chatTime;

  other(chat: Chat): Chat['farmer'] {
    return this.role() === 'farmer' ? chat.worker : chat.farmer;
  }

  preview(chat: Chat): string {
    const last = chat.last_message;
    if (!last) return 'Sem mensagens';
    return last.sender === this.role() ? `Você: ${last.body}` : last.body;
  }
}
