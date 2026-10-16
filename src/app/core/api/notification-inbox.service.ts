import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { UserRole } from '../models/auth.model';
import { AppNotification, NotificationsPage } from '../models/notification.model';
import { LiveUpdatesService } from './live-updates.service';
import { NotificationService } from './notification.service';

interface Inbox {
  role: UserRole;
  profileId: number;
  page: NotificationsPage | null; // null: ainda carregando
}

// Os avisos do painel aberto, sempre atualizados: o layout da área conecta ao abrir e a lista se renova
// a cada aviso em tempo real (SSE). Daqui saem o contador do sino e a tela de notificações.
@Injectable({ providedIn: 'root' })
export class NotificationInboxService {
  private readonly api = inject(NotificationService);
  private readonly live = inject(LiveUpdatesService);
  private readonly inbox = signal<Inbox | null>(null);

  readonly loaded = computed(() => (this.inbox()?.page ?? null) !== null);
  readonly items = computed(() => this.inbox()?.page?.items ?? []);
  readonly unread = computed(() => this.inbox()?.page?.unread ?? 0);

  connect(role: UserRole, profileId: number, destroyRef: DestroyRef): void {
    this.inbox.set({ role, profileId, page: null });
    this.refresh();
    this.live.notifications(role, profileId).pipe(takeUntilDestroyed(destroyRef)).subscribe(() => this.refresh());
    destroyRef.onDestroy(() => {
      const current = this.inbox();
      if (current?.role === role && current.profileId === profileId) this.inbox.set(null);
    });
  }

  refresh(): void {
    const target = this.inbox();
    if (!target) return;
    this.api.list(target.role, target.profileId).subscribe({
      next: (page) => this.setPage(target, page),
      error: () => undefined // sem conexão: fica o que já estava; o próximo aviso tenta de novo
    });
  }

  // Marca como lidos na hora (o sino zera sem esperar a resposta). Sem `ids`, todos.
  markRead(ids?: number[]): void {
    const target = this.inbox();
    const page = target?.page;
    if (!target || !page) return;
    const read = (n: AppNotification): boolean => n.read || ids === undefined || ids.includes(n.id);
    const items = page.items.map((n) => (read(n) ? { ...n, read: true } : n));
    const unreadNow = page.unread - page.items.filter((n) => !n.read && read(n)).reduce((sum, n) => sum + n.count, 0);
    this.setPage(target, { unread: Math.max(0, unreadNow), items });
    this.api.markRead(target.role, target.profileId, ids).subscribe({
      next: ({ unread }) => {
        const current = this.inbox();
        if (current?.page && current.role === target.role && current.profileId === target.profileId) this.setPage(current, { ...current.page, unread });
      },
      error: () => this.refresh()
    });
  }

  // Resposta de um painel que já foi trocado (troca de perfil no meio do caminho) é ignorada.
  private setPage(target: Inbox, page: NotificationsPage): void {
    const current = this.inbox();
    if (current?.role === target.role && current.profileId === target.profileId) this.inbox.set({ ...current, page });
  }
}
