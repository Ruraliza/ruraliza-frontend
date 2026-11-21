import { Component, computed, inject, input, output, signal } from '@angular/core';
import { ChatService } from '@core/api/chat.service';
import { UserRole } from '@core/models/auth.model';
import { Proposal, ProposalAnswer } from '@core/models/service-application.model';
import { Button } from '../../ui/button';
import { Icon } from '../../ui/icon';
import { PROPOSAL_STATUS_LABEL, priceLabel } from '../utils/agreement';

// Cartão de uma proposta dentro da conversa: valor, unidade e observações.
// Quem recebeu a proposta (e só ele) aceita, recusa ou faz uma contraproposta enquanto ela está pendente.
@Component({
  selector: 'app-proposal-card',
  imports: [Button, Icon],
  host: { role: 'group', '[attr.aria-label]': 'title()', '[class]': '"status-" + proposal().status' },
  template: `
    <p class="t-label who"><app-icon name="money" [size]="18" />{{ title() }}</p>
    <p class="price">{{ price() }}</p>
    @if (proposal().notes; as notes) { <p class="t-body-sm notes">{{ notes }}</p> }
    <p class="t-body-sm state">{{ status() }}</p>
    @if (canAnswer()) {
      <div class="actions">
        <button appButton type="button" [loading]="answering() === 'Accept'" [disabled]="answering() !== null" (click)="answer('Accept')">Aceitar</button>
        <button appButton variant="secondary" type="button" [loading]="answering() === 'Decline'" [disabled]="answering() !== null" (click)="answer('Decline')">Recusar</button>
        <button appButton variant="ghost" type="button" [disabled]="answering() !== null" (click)="counter.emit(proposal())">Contrapropor</button>
      </div>
    }
  `,
  styles: `
    :host {
      display: grid; gap: var(--space-1); width: min(100%, 26rem); justify-self: center; padding: var(--space-4);
      border: 2px solid var(--line-strong); border-radius: var(--radius-lg); background: var(--surface-raised); color: var(--ink);
    }
    :host(.status-Accepted) { border-color: var(--mata); background: var(--mint-100); }
    :host(.status-Declined), :host(.status-Superseded) { opacity: 0.8; }
    p { margin: 0; }
    .who { display: inline-flex; align-items: center; gap: var(--space-2); color: var(--ink-muted); }
    .price { font: 700 1.375rem/1.75rem var(--font-display); font-variant-numeric: tabular-nums; }
    .notes { white-space: pre-line; }
    .state { font-weight: 700; }
    :host(.status-Superseded) .price, :host(.status-Declined) .price { text-decoration: line-through; }
    .actions { display: flex; flex-wrap: wrap; gap: var(--space-2); margin-top: var(--space-2); }
    @media (max-width: 479px) { .actions > button { flex: 1 1 100%; } }
  `
})
export class ProposalCard {
  readonly proposal = input.required<Proposal>();
  readonly role = input.required<UserRole>();
  readonly chatId = input.required<number>();
  // A conversa ainda aceita propostas e respostas (aberta e em negociação).
  readonly negotiating = input(false);
  readonly otherName = input('');

  readonly answered = output<void>();
  readonly counter = output<Proposal>();

  private readonly chatService = inject(ChatService);
  readonly answering = signal<ProposalAnswer | null>(null);

  readonly mine = computed(() => this.proposal().proposed_by === this.role());
  readonly title = computed(() => (this.mine() ? 'Sua proposta' : `Proposta de ${this.otherName()}`));
  readonly price = computed(() => priceLabel(this.proposal()));
  readonly canAnswer = computed(() => this.negotiating() && !this.mine() && this.proposal().status === 'Pending');
  readonly status = computed(() => {
    const p = this.proposal();
    if (p.status === 'Pending') return this.mine() ? `Aguardando ${this.otherName()} responder` : 'Responda: aceitar, recusar ou contrapropor';
    if (p.status === 'Accepted') return this.role() === 'farmer' ? 'Aceita. Agora você pode aceitar a candidatura.' : 'Aceita. Falta o produtor aceitar a candidatura.';
    return PROPOSAL_STATUS_LABEL[p.status];
  });

  answer(action: ProposalAnswer): void {
    this.answering.set(action);
    this.chatService.answerProposal(this.chatId(), this.proposal().id, action).subscribe({
      next: () => {
        this.answering.set(null);
        this.answered.emit();
      },
      error: () => this.answering.set(null)
    });
  }
}
