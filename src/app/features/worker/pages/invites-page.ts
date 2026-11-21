import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { InviteAnswer, InviteStatus, InviteWithService } from '@core/models/service-application.model';
import { ToastService } from '@core/toast/toast.service';
import { ServiceCard } from '@shared/domain/ui/service-card';
import { Button } from '@shared/ui/button';
import { EmptyState } from '@shared/ui/empty-state';
import { Icon } from '@shared/ui/icon';
import { Skeleton } from '@shared/ui/skeleton';
import { formatDate } from '@shared/utils/format';
import { InviteInboxService } from '../data-access/invite-inbox.service';
import { WorkerService } from '../data-access/worker.service';

const STATUS_TEXT: Record<InviteStatus, string> = {
  Pending: 'Aguardando sua resposta',
  Accepted: 'Você aceitou',
  Declined: 'Você recusou',
  Expired: 'Expirou: a vaga fechou'
};

// Convites dos produtores (catálogo de prestadores): os pendentes primeiro. Aceitar vira candidatura e abre
// a conversa com o produtor; recusar avisa o produtor.
@Component({
  selector: 'app-invites-page',
  imports: [RouterLink, Button, EmptyState, Icon, ServiceCard, Skeleton],
  template: `
    <div class="container page">
      <div class="page-header">
        <div>
          <h1>Convites</h1>
          <p class="muted">Produtores que viram seu perfil no catálogo e chamaram você para um serviço.</p>
        </div>
      </div>

      @if (invites() === null) {
        <app-skeleton [count]="2" [height]="200" />
      } @else if (invites()?.length) {
        <ul class="list" role="list">
          @for (invite of invites(); track invite.id) {
            <li class="invite" [class.pending]="invite.status === 'Pending'">
              <p class="t-label status">
                <app-icon [name]="invite.status === 'Pending' ? 'bell' : invite.status === 'Accepted' ? 'check' : 'dash'" [size]="20" />
                {{ statusText(invite.status) }}<span class="muted t-body-sm"> · convite de {{ date(invite.insertion_date) }}</span>
              </p>
              <app-service-card [service]="invite.service" [link]="['/trabalhador/vagas', invite.service_id]" [showStatus]="false" />
              @if (invite.status === 'Pending') {
                <div class="actions">
                  <button appButton type="button" [disabled]="busy() === invite.id" (click)="answer(invite, 'Accept')"><app-icon name="check" [size]="20" />Aceitar</button>
                  <button appButton variant="secondary" type="button" [disabled]="busy() === invite.id" (click)="answer(invite, 'Decline')">Recusar</button>
                </div>
                <p class="t-body-sm muted">Ao aceitar, você vira candidato e a conversa com o produtor abre na hora.</p>
              }
            </li>
          }
        </ul>
      } @else {
        <app-empty-state [art]="true" title="Nenhum convite por enquanto" message="Quando um produtor convidar você pelo catálogo, o convite aparece aqui. Escolha os serviços que você quer nas preferências do perfil.">
          <a appButton variant="secondary" routerLink="/trabalhador/perfil">Ver preferências</a>
        </app-empty-state>
      }
    </div>
  `,
  styles: `
    .list { display: grid; gap: var(--space-4); margin: 0; padding: 0; list-style: none; }
    .invite {
      display: grid; gap: var(--space-3); padding: var(--space-4);
      border: 1px solid var(--line); border-radius: var(--radius-lg); background: var(--surface);
    }
    .invite.pending { border: 2px solid var(--mata); }
    .status { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-2); margin: 0; }
    .actions { display: flex; flex-wrap: wrap; gap: var(--space-3); }
    .actions button { flex: 1 1 140px; }
    p { margin: 0; }
  `
})
export class InvitesPage {
  private readonly workerService = inject(WorkerService);
  private readonly inbox = inject(InviteInboxService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  readonly invites = computed(() => this.inbox.invites());
  readonly busy = signal<number | null>(null);
  readonly date = formatDate;

  constructor() {
    // O layout da área conecta a lista; aqui ela é lida de novo ao abrir a tela.
    this.inbox.refresh();
  }

  statusText(status: InviteStatus): string {
    return STATUS_TEXT[status];
  }

  answer(invite: InviteWithService, action: InviteAnswer): void {
    this.busy.set(invite.id);
    this.workerService.answerInvite(invite.id, action).subscribe({
      next: (result) => {
        this.busy.set(null);
        this.inbox.replace({ ...invite, ...result.invite });
        if (action === 'Decline') {
          this.toast.success('Convite recusado. O produtor foi avisado.');
          return;
        }
        this.toast.success('Convite aceito! Você já é candidato. Converse com o produtor.');
        if (result.chat_id !== undefined) void this.router.navigate(['/trabalhador/conversas', result.chat_id]);
      },
      // Convite expirado, vaga fechada etc.: a mensagem da API aparece no aviso de erro, e a lista é relida.
      error: () => {
        this.busy.set(null);
        this.inbox.refresh();
      }
    });
  }
}
