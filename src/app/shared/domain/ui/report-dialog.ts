import { Component, ElementRef, afterRenderEffect, computed, effect, inject, input, output, signal, untracked, viewChild } from '@angular/core';
import { ReportService } from '@core/api/report.service';
import { ApiError } from '@core/http/api-error';
import { UserRole } from '@core/models/auth.model';
import { ReportReason, ReportTargetType } from '@core/models/report.model';
import { CurrentUserService } from '@core/session/current-user.service';
import { ToastService } from '@core/toast/toast.service';
import { Button } from '../../ui/button';
import { Icon } from '../../ui/icon';
import { REPORT_DETAILS_MAX_LENGTH, reasonOptions } from '../utils/reports';

// O que está sendo denunciado: a vaga (pelo trabalhador) ou a pessoa (de um lado ou do outro).
export interface ReportTarget {
  type: ReportTargetType;
  id: number;
  name: string; // nome da vaga ou da pessoa
}

// Denúncia em <dialog> modal, aberto enquanto `target` não for null. Os motivos mudam com o alvo;
// o relato é opcional, menos no "Outro motivo". Só a equipe lê, e quem foi denunciado não sabe quem foi.
@Component({
  selector: 'app-report-dialog',
  imports: [Button, Icon],
  template: `
    <dialog #dialog aria-labelledby="report-title" (cancel)="onCancel($event)">
      <form (submit)="submit($event)" novalidate>
        <div class="head">
          <h2 id="report-title">{{ heading() }}</h2>
          @if (target()?.type === 'service') { <p class="muted">{{ target()?.name }}</p> }
        </div>

        <fieldset>
          <legend>O que está errado?</legend>
          @for (option of options(); track option.value) {
            <label class="reason">
              <input type="radio" name="report-reason" [value]="option.value" [checked]="reason() === option.value" (change)="reason.set(option.value)">
              <span><b>{{ option.label }}</b><span class="t-body-sm muted">{{ option.hint }}</span></span>
            </label>
          }
          @if (attempted() && !reason()) { <p class="error t-body-sm" role="alert">Escolha o motivo.</p> }
        </fieldset>

        <div class="details">
          <label for="report-details">O que aconteceu?@if (reason() !== 'outro') { <span class="muted"> (opcional)</span> }</label>
          <textarea #detailsBox id="report-details" rows="3" [maxLength]="max" [value]="details()" (input)="onDetails($event)"
            [attr.aria-invalid]="detailsError() ? true : null" aria-describedby="report-count"></textarea>
          <p id="report-count" class="count t-body-sm muted">{{ details().length }}/{{ max }}</p>
          @if (detailsError()) { <p class="error t-body-sm" role="alert">Conte o que aconteceu, para a equipe entender.</p> }
        </div>

        <ul class="notes t-body-sm" role="list">
          <li><app-icon name="lock" [size]="16" />Só a equipe do Ruraliza lê. {{ who() }} não fica sabendo quem denunciou.</li>
          <li><app-icon name="phone" [size]="16" />Risco à vida ou trabalho forçado? Ligue 190 ou Disque 100.</li>
        </ul>

        <div class="actions">
          <button appButton variant="secondary" type="button" [disabled]="sending()" (click)="closed.emit()">Cancelar</button>
          <button appButton type="submit" [loading]="sending()">Enviar denúncia</button>
        </div>
      </form>
    </dialog>
  `,
  styles: `
    dialog {
      width: min(520px, calc(100vw - 2 * var(--space-4)));
      max-height: calc(100dvh - 2 * var(--space-4));
      padding: var(--space-6); border: 0; border-radius: var(--radius-lg);
      background: var(--surface-raised); color: var(--ink); box-shadow: var(--shadow-float); overflow-y: auto;
    }
    dialog::backdrop { background: var(--scrim); }
    form { display: grid; gap: var(--space-4); }
    .head { display: grid; gap: var(--space-1); }
    h2, .head p { margin: 0; overflow-wrap: anywhere; }
    h2 { font-size: 1.25rem; line-height: 1.625rem; }
    fieldset { display: grid; gap: var(--space-2); margin: 0; padding: 0; border: 0; }
    legend { margin-bottom: var(--space-2); font-weight: 600; }
    .reason {
      display: grid; grid-template-columns: auto 1fr; gap: var(--space-3); align-items: start; padding: var(--space-3) var(--space-4);
      border: 2px solid var(--line); border-radius: var(--radius-md); cursor: pointer;
    }
    .reason input { margin: 0.2rem 0 0; width: 1.125rem; height: 1.125rem; }
    .reason > span { display: grid; gap: 2px; }
    .reason:hover { border-color: var(--line-strong); }
    .reason:has(input:checked) { border-color: var(--mata); background: var(--broto-soft); }
    .reason:has(input:focus-visible) { box-shadow: var(--focus-ring); }
    .details { display: grid; gap: var(--space-2); }
    .details label { font-weight: 600; }
    .count { justify-self: end; margin: 0; font-variant-numeric: tabular-nums; }
    .error { margin: 0; color: var(--danger); font-weight: 600; }
    .notes { display: grid; gap: var(--space-2); margin: 0; padding: var(--space-3) var(--space-4); border-radius: var(--radius-md); background: var(--surface-sunken); color: var(--ink-muted); }
    .notes li { display: flex; gap: var(--space-2); align-items: flex-start; }
    .notes app-icon { margin-top: 2px; }
    .actions { display: flex; flex-wrap: wrap-reverse; justify-content: flex-end; gap: var(--space-3); }
    @media (max-width: 479px) {
      dialog { padding: var(--space-4); }
      .actions { flex-direction: column-reverse; }
      .actions > button { width: 100%; }
    }
  `
})
export class ReportDialog {
  readonly target = input.required<ReportTarget | null>();
  readonly role = input.required<UserRole>(); // quem denuncia
  readonly closed = output<void>();

  private readonly reports = inject(ReportService);
  private readonly currentUser = inject(CurrentUserService);
  private readonly toast = inject(ToastService);
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  private readonly detailsBox = viewChild<ElementRef<HTMLTextAreaElement>>('detailsBox');

  readonly max = REPORT_DETAILS_MAX_LENGTH;
  readonly reason = signal<ReportReason | null>(null);
  readonly details = signal('');
  readonly attempted = signal(false);
  readonly sending = signal(false);

  readonly options = computed(() => {
    const target = this.target();
    return target ? reasonOptions(target.type) : [];
  });
  readonly heading = computed(() => {
    const target = this.target();
    return !target || target.type === 'service' ? 'Denunciar vaga' : `Denunciar ${target.name}`;
  });
  // Quem não fica sabendo: o produtor da vaga ou a pessoa denunciada (pelo primeiro nome).
  readonly who = computed(() => {
    const target = this.target();
    if (!target) return '';
    return target.type === 'service' ? 'O produtor' : (target.name.split(' ')[0] ?? target.name);
  });
  readonly detailsError = computed(() => this.attempted() && this.reason() === 'outro' && !this.details().trim());

  constructor() {
    // Cada abertura começa do zero.
    effect(() => {
      if (this.target()) {
        untracked(() => {
          this.reason.set(null);
          this.details.set('');
          this.attempted.set(false);
        });
      }
    });
    afterRenderEffect(() => {
      const element = this.dialog().nativeElement;
      const open = this.target() !== null;
      if (open && !element.open) element.showModal();
      if (!open && element.open) element.close();
    });
  }

  onDetails(event: Event): void {
    this.details.set((event.target as HTMLTextAreaElement).value);
  }

  onCancel(event: Event): void {
    event.preventDefault();
    if (!this.sending()) this.closed.emit();
  }

  submit(event: Event): void {
    event.preventDefault();
    this.attempted.set(true);
    const target = this.target();
    const reason = this.reason();
    const profileId = this.currentUser.user()?.profiles[this.role()] ?? null;
    if (this.detailsError()) this.detailsBox()?.nativeElement.focus();
    if (!target || !reason || this.detailsError() || profileId === null) return;

    this.sending.set(true);
    const details = this.details().trim() || null;
    this.reports.send(this.role(), profileId, { target_type: target.type, target_id: target.id, reason, details }).subscribe({
      next: () => {
        this.sending.set(false);
        this.toast.success('Denúncia enviada. A equipe vai analisar e avisar você do resultado.');
        this.closed.emit();
      },
      error: (error: unknown) => {
        // A mensagem já saiu no toast. Denúncia repetida (409): não há o que corrigir, fecha.
        this.sending.set(false);
        if (error instanceof ApiError && error.status === 409) this.closed.emit();
      }
    });
  }
}
