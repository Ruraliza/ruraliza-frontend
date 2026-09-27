import { Component, ElementRef, afterRenderEffect, input, output, viewChild } from '@angular/core';
import { Button, ButtonVariant } from './button';

// Confirmação na própria página (sem window.confirm), usando <dialog> modal:
// foco preso no diálogo e Esc para cancelar.
@Component({
  selector: 'app-confirm-dialog',
  imports: [Button],
  template: `
    <dialog #dialog aria-labelledby="confirm-title" aria-describedby="confirm-message" (cancel)="onCancel($event)">
      <h2 id="confirm-title">{{ title() }}</h2>
      <p id="confirm-message" class="muted">{{ message() }}</p>
      <div class="actions">
        <button appButton variant="secondary" type="button" [disabled]="loading()" (click)="cancelled.emit()">Cancelar</button>
        <button appButton [variant]="confirmVariant()" type="button" [loading]="loading()" (click)="confirmed.emit()">
          {{ confirmLabel() }}
        </button>
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
    dialog[open] { display: grid; gap: var(--space-4); }
    .actions { display: flex; flex-wrap: wrap-reverse; justify-content: flex-end; gap: var(--space-3); padding-top: var(--space-2); }
  `
})
export class ConfirmDialog {
  readonly open = input.required<boolean>();
  readonly title = input.required<string>();
  readonly message = input.required<string>();
  readonly confirmLabel = input.required<string>();
  readonly confirmVariant = input<ButtonVariant>('primary');
  readonly loading = input(false);

  readonly confirmed = output<void>();
  readonly cancelled = output<void>();

  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  constructor() {
    afterRenderEffect(() => {
      const element = this.dialog().nativeElement;
      if (this.open() && !element.open) element.showModal();
      if (!this.open() && element.open) element.close();
    });
  }

  // Esc: fecha pelo fluxo normal de cancelamento (não enquanto a ação está em andamento).
  onCancel(event: Event): void {
    event.preventDefault();
    if (!this.loading()) this.cancelled.emit();
  }
}
