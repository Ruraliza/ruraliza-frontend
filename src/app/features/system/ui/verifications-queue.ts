import { Component, computed, effect, inject, output, signal } from '@angular/core';
import { ModerationService } from '../data-access/moderation.service';
import { ReviewVerificationDialog, VerificationReviewRequest } from './review-verification-dialog';
import { VerificationDecision, VerificationRequestCard } from './verification-request-card';
import { AdminVerification } from '@core/models/verification.model';
import { ToastService } from '@core/toast/toast.service';
import { EmptyState } from '@shared/ui/empty-state';
import { ErrorState } from '@shared/ui/error-state';
import { Icon } from '@shared/ui/icon';
import { Skeleton } from '@shared/ui/skeleton';
import { RemoteData } from '@shared/utils/remote-data';

// Fila de verificações de identidade: o envio mais antigo primeiro (quem espera há mais tempo) e,
// recolhidas embaixo, as já decididas (sem a foto, que é apagada na decisão). `pendingCount` vai para a aba.
@Component({
  selector: 'app-verifications-queue',
  imports: [EmptyState, ErrorState, Icon, ReviewVerificationDialog, Skeleton, VerificationRequestCard],
  template: `
    @switch (requests.state().status) {
      @case ('loading') { <app-skeleton [count]="2" [height]="220" /> }
      @case ('error') { <app-error-state [message]="requests.error()" (retry)="requests.load()" /> }
      @case ('success') {
        @if (pending().length) {
          <ul class="list" role="list">
            @for (request of pending(); track request.id) {
              <li><app-verification-request-card [request]="request" (decide)="ask(request, $event)" /></li>
            }
          </ul>
        } @else {
          <app-empty-state icon="shield-check" title="Nenhuma verificação em análise" message="Quando alguém enviar a foto do documento pelo perfil, o pedido aparece aqui." />
        }

        @if (decided().length) {
          <details class="history">
            <summary><app-icon name="plus" [size]="20" />Já decididas ({{ decided().length }})</summary>
            <ul class="list" role="list">
              @for (request of decided(); track request.id) {
                <li><app-verification-request-card [request]="request" /></li>
              }
            </ul>
          </details>
        }
      }
    }

    <app-review-verification-dialog [review]="review()" [loading]="saving()" (confirmed)="decide($event)" (cancelled)="review.set(null)" />
  `,
  styles: `
    :host { display: grid; gap: var(--space-4); max-width: 960px; }
    .list { display: grid; gap: var(--space-3); margin: 0; padding: 0; list-style: none; }
    .history { display: grid; gap: var(--space-3); }
    summary { min-height: 44px; display: flex; align-items: center; gap: var(--space-2); font-weight: 600; color: var(--mata); cursor: pointer; list-style: none; }
    summary::-webkit-details-marker { display: none; }
    summary app-icon { transition: transform .2s var(--ease-out); }
    .history[open] summary app-icon { transform: rotate(45deg); }
    .history[open] summary { margin-bottom: var(--space-3); }
  `
})
export class VerificationsQueue {
  readonly pendingCount = output<number>();

  private readonly moderation = inject(ModerationService);
  private readonly toast = inject(ToastService);

  readonly requests = new RemoteData<AdminVerification[]>(() => this.moderation.verifications());
  readonly review = signal<VerificationReviewRequest | null>(null);
  readonly saving = signal(false);

  readonly pending = computed(() => (this.requests.data() ?? []).filter((r) => r.status === 'pending'));
  readonly decided = computed(() =>
    (this.requests.data() ?? []).filter((r) => r.status !== 'pending').sort((a, b) => (b.reviewed_at ?? '').localeCompare(a.reviewed_at ?? ''))
  );

  constructor() {
    this.requests.load();
    effect(() => this.pendingCount.emit(this.pending().length));
  }

  ask(request: AdminVerification, decision: VerificationDecision): void {
    this.review.set({ request, decision });
  }

  decide(reason: string): void {
    const review = this.review();
    if (!review) return;
    this.saving.set(true);
    const input = review.decision === 'approved' ? { status: 'approved' as const } : { status: 'rejected' as const, reason };
    this.moderation.reviewVerification(review.request.id, input).subscribe({
      next: ({ verification }) => {
        this.saving.set(false);
        this.review.set(null);
        // Aprovar pode dar o selo também ao outro perfil da conta: recarrega a fila inteira.
        this.requests.refresh();
        this.toast.success(verification.status === 'approved' ? `${verification.name} agora é verificado.` : 'Verificação recusada. A pessoa recebe o motivo.');
      },
      error: () => {
        this.saving.set(false);
        this.review.set(null);
        this.requests.refresh();
      }
    });
  }
}
