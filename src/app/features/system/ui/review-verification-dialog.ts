import { Component, ElementRef, afterRenderEffect, computed, effect, input, output, signal, untracked, viewChild } from '@angular/core';
import { AdminVerification } from '@core/models/verification.model';
import { Button } from '@shared/ui/button';
import { VerificationDecision } from './verification-request-card';

export interface VerificationReviewRequest {
  request: AdminVerification;
  decision: VerificationDecision;
}

export const REJECTION_MAX_LENGTH = 300;

// Os motivos mais comuns, para a equipe não precisar digitar (dá para editar depois de escolher).
const QUICK_REASONS = [
  'A foto ficou ilegível',
  'O nome não é o mesmo do perfil',
  'O CPF não é o mesmo do perfil',
  'O documento não aparece inteiro'
];

// Confirma a decisão sobre um pedido de verificação. Recusar pede o motivo, que a pessoa vê.
@Component({
  selector: 'app-review-verification-dialog',
  imports: [Button],
  template: `
    <dialog #dialog aria-labelledby="verification-review-title" aria-describedby="verification-review-message" (cancel)="onCancel($event)">
      <h2 id="verification-review-title">{{ rejecting() ? 'Recusar a verificação?' : 'Aprovar a verificação?' }}</h2>
      <p id="verification-review-message" class="muted">{{ message() }}</p>
      @if (rejecting()) {
        <div class="quick" role="group" aria-label="Motivos comuns">
          @for (option of quickReasons; track option) {
            <button type="button" [class.picked]="reason() === option" (click)="reason.set(option)">{{ option }}</button>
          }
        </div>
        <label for="verification-reason">Motivo <span class="muted">(a pessoa vê)</span></label>
        <textarea id="verification-reason" rows="2" [maxLength]="max" [value]="reason()" (input)="onReason($event)"
          [attr.aria-invalid]="missing() ? true : null"></textarea>
        @if (missing()) { <p class="error t-body-sm" role="alert">Escolha ou escreva o motivo da recusa.</p> }
      }
      <div class="actions">
        <button appButton variant="secondary" type="button" [disabled]="loading()" (click)="cancelled.emit()">Cancelar</button>
        <button appButton [variant]="rejecting() ? 'danger' : 'primary'" type="button" [loading]="loading()" (click)="confirm()">
          {{ rejecting() ? 'Recusar' : 'Aprovar' }}
        </button>
      </div>
    </dialog>
  `,
  styles: `
    dialog {
      width: min(520px, calc(100vw - 2 * var(--space-4)));
      padding: var(--space-6); border: 0; border-radius: var(--radius-lg);
      background: var(--surface-raised); color: var(--ink); box-shadow: var(--shadow-float);
    }
    dialog::backdrop { background: var(--scrim); }
    dialog[open] { display: grid; gap: var(--space-3); }
    h2, p { margin: 0; }
    label { margin-top: var(--space-1); font-weight: 600; }
    .quick { display: flex; flex-wrap: wrap; gap: var(--space-2); }
    .quick button {
      min-height: 40px; padding: 0 var(--space-3); border: 1px solid var(--line-strong); border-radius: var(--radius-pill);
      background: var(--surface-raised); color: var(--ink); font-size: 0.875rem; font-weight: 600;
    }
    .quick button.picked { border-color: var(--mata); background: var(--broto-soft); }
    .error { color: var(--danger); font-weight: 600; }
    .actions { display: flex; flex-wrap: wrap-reverse; justify-content: flex-end; gap: var(--space-3); padding-top: var(--space-3); }
    @media (max-width: 479px) {
      dialog { padding: var(--space-4); }
      .actions { flex-direction: column-reverse; }
      .actions > button { width: 100%; }
    }
  `
})
export class ReviewVerificationDialog {
  readonly review = input.required<VerificationReviewRequest | null>();
  readonly loading = input(false);
  readonly confirmed = output<string>(); // o motivo (vazio ao aprovar)
  readonly cancelled = output<void>();

  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  readonly max = REJECTION_MAX_LENGTH;
  readonly quickReasons = QUICK_REASONS;
  readonly reason = signal('');
  readonly attempted = signal(false);

  readonly rejecting = computed(() => this.review()?.decision === 'rejected');
  readonly missing = computed(() => this.attempted() && this.rejecting() && !this.reason().trim());
  readonly message = computed(() => {
    const review = this.review();
    if (!review) return '';
    const who = review.request.name.split(' ')[0] ?? review.request.name;
    return review.decision === 'approved'
      ? `${who} ganha o selo de verificado e recebe um aviso. A foto do documento é apagada.`
      : `${who} recebe um aviso com o motivo e pode enviar o documento de novo. A foto atual é apagada.`;
  });

  constructor() {
    effect(() => {
      if (this.review()) {
        untracked(() => {
          this.reason.set('');
          this.attempted.set(false);
        });
      }
    });
    afterRenderEffect(() => {
      const element = this.dialog().nativeElement;
      const open = this.review() !== null;
      if (open && !element.open) element.showModal();
      if (!open && element.open) element.close();
    });
  }

  onReason(event: Event): void {
    this.reason.set((event.target as HTMLTextAreaElement).value);
  }

  confirm(): void {
    this.attempted.set(true);
    if (this.missing()) return;
    this.confirmed.emit(this.rejecting() ? this.reason().trim() : '');
  }

  onCancel(event: Event): void {
    event.preventDefault();
    if (!this.loading()) this.cancelled.emit();
  }
}
