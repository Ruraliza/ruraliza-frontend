import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LiveUpdatesService } from '@core/api/live-updates.service';
import { InviteWithService } from '@core/models/service-application.model';
import { WorkerService } from './worker.service';

// Convites do trabalhador, sempre atualizados enquanto a área está aberta: cada convite novo chega como
// aviso (central de notificações), e a cada aviso a lista é lida de novo. Daqui sai o selo do menu.
@Injectable({ providedIn: 'root' })
export class InviteInboxService {
  private readonly api = inject(WorkerService);
  private readonly live = inject(LiveUpdatesService);
  private readonly workerId = signal<number | null>(null);
  private readonly list = signal<InviteWithService[] | null>(null);

  readonly invites = this.list.asReadonly();
  readonly pending = computed(() => (this.list() ?? []).filter((i) => i.status === 'Pending').length);

  connect(workerId: number, destroyRef: DestroyRef): void {
    this.workerId.set(workerId);
    this.refresh();
    this.live.notifications('worker', workerId).pipe(takeUntilDestroyed(destroyRef)).subscribe(() => this.refresh());
    destroyRef.onDestroy(() => {
      if (this.workerId() === workerId) {
        this.workerId.set(null);
        this.list.set(null);
      }
    });
  }

  refresh(): void {
    const workerId = this.workerId();
    if (workerId === null) return;
    this.api.getInvites(workerId).subscribe({
      next: (list) => { if (this.workerId() === workerId) this.list.set(list); },
      error: () => undefined // sem conexão: fica o que já estava; o próximo aviso tenta de novo
    });
  }

  // Resposta dada nesta tela: atualiza na hora, sem esperar a próxima leitura.
  replace(updated: InviteWithService): void {
    this.list.update((list) => list?.map((i) => (i.id === updated.id ? updated : i)) ?? null);
  }
}
