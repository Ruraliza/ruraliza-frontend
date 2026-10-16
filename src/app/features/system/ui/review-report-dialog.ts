import { Component, ElementRef, afterRenderEffect, computed, effect, input, output, signal, untracked, viewChild } from '@angular/core';
import { AdminReport } from '@core/models/report.model';
import { Button } from '@shared/ui/button';
import { ReportDecision } from './report-card';

export interface ReviewRequest {
  report: AdminReport;
  decision: ReportDecision;
}

export const REVIEW_NOTE_MAX_LENGTH = 500;

// Confirma a decisão sobre uma denúncia, com uma anotação interna opcional. Aberto enquanto
// `request` não for null; `confirmed` leva a anotação (vazia = sem anotação).
@Component({
  selector: 'app-review-report-dialog',
  imports: [Button],
  template: `
    <dialog #dialog aria-labelledby="review-title" aria-describedby="review-message" (cancel)="onCancel($event)">
      <h2 id="review-title">{{ title() }}</h2>
      <p id="review-message" class="muted">{{ message() }}</p>
      <label for="review-note">Anotação interna <span class="muted">(opcional)</span></label>
      <textarea id="review-note" rows="3" [maxLength]="max" [value]="note()" (input)="onNote($event)"
        placeholder="Ex.: conta removida; conversei com a pessoa"></textarea>
      <div class="actions">
        <button appButton variant="secondary" type="button" [disabled]="loading()" (click)="cancelled.emit()">Cancelar</button>
        <button appButton type="button" [loading]="loading()" (click)="confirmed.emit(note().trim())">{{ confirmLabel() }}</button>
      </div>
    </dialog>
  `,
  styles: `
    dialog {
      width: min(480px, calc(100vw - 2 * var(--space-4)));
      padding: var(--space-6); border: 0; border-radius: var(--radius-lg);
      background: var(--surface-raised); color: var(--ink); box-shadow: var(--shadow-float);
    }
    dialog::backdrop { background: var(--scrim); }
    dialog[open] { display: grid; gap: var(--space-3); }
    h2, p { margin: 0; }
    label { margin-top: var(--space-2); font-weight: 600; }
    .actions { display: flex; flex-wrap: wrap-reverse; justify-content: flex-end; gap: var(--space-3); padding-top: var(--space-3); }
    @media (max-width: 479px) {
      dialog { padding: var(--space-4); }
      .actions { flex-direction: column-reverse; }
      .actions > button { width: 100%; }
    }
  `
})
export class ReviewReportDialog {
  readonly request = input.required<ReviewRequest | null>();
  readonly loading = input(false);
  readonly confirmed = output<string>();
  readonly cancelled = output<void>();

  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  readonly max = REVIEW_NOTE_MAX_LENGTH;
  readonly note = signal('');

  readonly title = computed(() => (this.request()?.decision === 'resolved' ? 'Denúncia procedente?' : 'Descartar a denúncia?'));
  readonly confirmLabel = computed(() => (this.request()?.decision === 'resolved' ? 'Marcar como procedente' : 'Descartar denúncia'));
  // O que acontece depois, nas palavras do aviso que quem denunciou recebe.
  readonly message = computed(() => {
    const request = this.request();
    if (!request) return '';
    const who = request.report.reporter.name.split(' ')[0] ?? request.report.reporter.name;
    return request.decision === 'resolved'
      ? `${who} recebe um aviso de que a equipe confirmou o problema e tomou providências. Remover ou editar a conta é feito em Usuários.`
      : `${who} recebe um aviso de que a equipe analisou e não encontrou quebra das regras.`;
  });

  constructor() {
    effect(() => {
      if (this.request()) untracked(() => this.note.set(''));
    });
    afterRenderEffect(() => {
      const element = this.dialog().nativeElement;
      const open = this.request() !== null;
      if (open && !element.open) element.showModal();
      if (!open && element.open) element.close();
    });
  }

  onNote(event: Event): void {
    this.note.set((event.target as HTMLTextAreaElement).value);
  }

  onCancel(event: Event): void {
    event.preventDefault();
    if (!this.loading()) this.cancelled.emit();
  }
}
