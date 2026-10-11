import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { UserRole } from '../models/auth.model';
import { Chat } from '../models/chat.model';
import { ChatService } from './chat.service';
import { LiveUpdatesService } from './live-updates.service';

interface Inbox {
  role: UserRole;
  profileId: number;
  chats: Chat[] | null; // null: ainda carregando
}

// As conversas do painel aberto, sempre atualizadas: o layout da área conecta ao abrir e a lista
// se renova a cada aviso em tempo real (mensagem nova, lida, conversa aberta ou encerrada).
// Daqui saem o contador do menu, a tela "Conversas" e o atalho "Conversar" das telas de serviço.
@Injectable({ providedIn: 'root' })
export class ChatInboxService {
  private readonly chatService = inject(ChatService);
  private readonly live = inject(LiveUpdatesService);
  private readonly inbox = signal<Inbox | null>(null);

  readonly chats = computed(() => this.inbox()?.chats ?? []);
  readonly loaded = computed(() => (this.inbox()?.chats ?? null) !== null);
  readonly unread = computed(() => this.chats().reduce((sum, chat) => sum + chat.unread, 0));

  // Acompanha as conversas do perfil enquanto quem chamou existir (o layout de cada área).
  connect(role: UserRole, profileId: number, destroyRef: DestroyRef): void {
    this.inbox.set({ role, profileId, chats: null });
    this.refresh();
    this.live.chats(role, profileId).pipe(takeUntilDestroyed(destroyRef)).subscribe(() => this.refresh());
    destroyRef.onDestroy(() => {
      const current = this.inbox();
      if (current?.role === role && current.profileId === profileId) this.inbox.set(null);
    });
  }

  refresh(): void {
    const target = this.inbox();
    if (!target) return;
    this.chatService.list(target.role, target.profileId).subscribe({
      next: (chats) => {
        // Resposta de um painel que já foi trocado (troca de perfil no meio do caminho): ignora.
        const current = this.inbox();
        if (current?.role === target.role && current.profileId === target.profileId) this.inbox.set({ ...current, chats });
      },
      error: () => undefined // sem conexão: o contador fica como estava e o aviso seguinte tenta de novo
    });
  }

  // A conversa mais recente de um serviço (a do trabalhador atual, se alguém desistiu antes).
  forService(serviceId: number): Chat | null {
    return this.chats().filter((chat) => chat.service_id === serviceId).sort((a, b) => b.id - a.id)[0] ?? null;
  }
}
