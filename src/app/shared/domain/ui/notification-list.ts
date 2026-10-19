import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NotificationInboxService } from '@core/api/notification-inbox.service';
import { AppNotification } from '@core/models/notification.model';
import { Button } from '../../ui/button';
import { EmptyState } from '../../ui/empty-state';
import { Icon, IconName } from '../../ui/icon';
import { Skeleton } from '../../ui/skeleton';
import { chatTime, dayLabel } from '../utils/chat';

interface DayGroup {
  label: string;
  items: AppNotification[];
}

// Ícone pela tela que o aviso abre (a API manda só título, texto e tela).
export function notificationIcon(url: string): IconName {
  if (url.includes('/conversas/')) return 'chat';
  if (url.startsWith('produtor/servicos')) return 'list';
  if (url.startsWith('trabalhador/candidaturas') || url.startsWith('trabalhador/vagas')) return 'briefcase';
  if (url.endsWith('/ajuda')) return 'shield'; // resultado de uma denúncia
  return 'bell';
}

// Agrupa por dia ("Hoje", "Ontem", "segunda-feira, 12 de outubro"), na ordem em que vieram (mais recentes primeiro).
export function groupByDay(items: readonly AppNotification[], now = new Date()): DayGroup[] {
  const groups: DayGroup[] = [];
  for (const item of items) {
    const label = dayLabel(item.insertion_date, now);
    const last = groups.at(-1);
    if (last?.label === label) last.items.push(item);
    else groups.push({ label, items: [item] });
  }
  return groups;
}

// Central de notificações do painel aberto: o histórico do sino, por dia. Tocar num aviso marca como lido
// e abre a tela dele; "Marcar todas como lidas" zera o sino. A lista se atualiza sozinha (NotificationInboxService).
@Component({
  selector: 'app-notification-list',
  imports: [RouterLink, Button, EmptyState, Icon, Skeleton],
  template: `
    <div class="container page">
      <div class="page-header">
        <div>
          <h1>Notificações</h1>
          <p class="muted">Candidaturas, aceites, pagamentos, mensagens e avaliações, mesmo com as notificações do celular desligadas.</p>
        </div>
        @if (inbox.unread()) {
          <button appButton variant="ghost" type="button" (click)="inbox.markRead()"><app-icon name="check" [size]="20" />Marcar todas como lidas</button>
        }
      </div>

      @if (!inbox.loaded()) {
        <app-skeleton [count]="4" [height]="76" />
      } @else if (groups().length) {
        @for (group of groups(); track group.label) {
          <section class="day" [attr.aria-label]="group.label">
            <h2 class="t-label muted">{{ group.label }}</h2>
            <ul class="list" role="list">
              @for (n of group.items; track n.id) {
                <li>
                  <a class="row" [class.unread]="!n.read" [routerLink]="'/' + n.url" (click)="open(n)">
                    <span class="icon"><app-icon [name]="icon(n.url)" [size]="22" /></span>
                    <span class="what">
                      <span class="line">
                        <span class="title">{{ n.title }}@if (!n.read) { <span class="visually-hidden">, não lida</span> }</span>
                        <span class="time t-body-sm">{{ time(n.insertion_date) }}</span>
                      </span>
                      <span class="line">
                        <span class="body t-body-sm">{{ n.body }}</span>
                        @if (n.count > 1) { <span class="count" [attr.aria-label]="n.count + ' avisos'">{{ n.count }}</span> }
                      </span>
                    </span>
                  </a>
                </li>
              }
            </ul>
          </section>
        }
      } @else {
        <app-empty-state icon="bell" title="Nenhum aviso ainda" message="Quando alguém se candidatar, aceitar sua candidatura, mandar mensagem ou avaliar um serviço, o aviso aparece aqui." />
      }
    </div>
  `,
  styles: `
    .page-header p { margin: var(--space-1) 0 0; max-width: 60ch; }
    .day { display: grid; gap: var(--space-2); }
    .day h2 { margin: 0; }
    .list { display: grid; gap: var(--space-2); }
    .row {
      display: flex; align-items: flex-start; gap: var(--space-3);
      padding: var(--space-3) var(--space-4); border-radius: var(--radius-lg);
      border: 1px solid var(--line); background: var(--surface-raised);
      color: var(--ink); text-decoration: none;
    }
    .row:hover { border-color: var(--line-strong); }
    .row.unread { border-color: var(--broto); background: var(--broto-soft); }
    .icon { display: grid; place-items: center; flex: none; width: 40px; height: 40px; border-radius: 50%; background: var(--surface-sunken); color: var(--ink-muted); }
    .unread .icon { background: var(--surface-raised); color: var(--ink); }
    .what { display: grid; gap: 2px; flex: 1; min-width: 0; }
    .line { display: flex; align-items: baseline; justify-content: space-between; gap: var(--space-2); min-width: 0; }
    .title { font-weight: 600; }
    .unread .title { font-weight: 800; }
    .time { flex: none; color: var(--ink-muted); font-variant-numeric: tabular-nums; }
    .body { color: var(--ink-muted); }
    .unread .body { color: var(--ink); }
    .count {
      flex: none; min-width: 1.5rem; height: 1.5rem; padding: 0 0.4375rem; border-radius: var(--radius-pill);
      background: var(--gold-500); color: var(--on-accent); font-size: 0.8125rem; font-weight: 800; line-height: 1.5rem; text-align: center;
    }
  `
})
export class NotificationList {
  protected readonly inbox = inject(NotificationInboxService);

  readonly groups = computed(() => groupByDay(this.inbox.items()));
  readonly icon = notificationIcon;
  readonly time = chatTime;

  open(notification: AppNotification): void {
    if (!notification.read) this.inbox.markRead([notification.id]);
  }
}
