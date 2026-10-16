import { Component, DestroyRef, computed, effect, inject, input, output, signal, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ModerationService } from '../data-access/moderation.service';
import { AdminVerification } from '@core/models/verification.model';
import { ROLE_LABEL } from '@core/session/roles';
import { Button } from '@shared/ui/button';
import { formatCpf, formatDate } from '@shared/utils/format';

export type VerificationDecision = 'approved' | 'rejected';

const DOCUMENT_LABEL = { rg: 'RG', cnh: 'CNH' } as const;
const STATUS_LABEL = { pending: 'Em análise', approved: 'Aprovada', rejected: 'Recusada' } as const;

// Um pedido de verificação: a foto do documento ao lado do nome e do CPF do perfil, para a equipe
// conferir. A foto vem como Blob (com o token de sistema) e só existe enquanto o pedido está em análise.
@Component({
  selector: 'app-verification-request-card',
  imports: [RouterLink, Button],
  template: `
    @if (request().has_document) {
      <figure class="document">
        @if (photoUrl(); as url) {
          <a [href]="url" target="_blank" rel="noopener"><img [src]="url" [alt]="'Foto do documento (' + documentLabel() + ') enviada por ' + request().name" /></a>
          <figcaption class="t-body-sm muted">Toque na foto para ampliar.</figcaption>
        } @else {
          <span class="placeholder t-body-sm muted">{{ photoError() ? 'Não foi possível abrir a foto.' : 'Carregando a foto…' }}</span>
        }
      </figure>
    }
    <div class="info">
      <div class="head">
        <h2 class="t-h3">{{ request().name }}</h2>
        <span class="status" [attr.data-status]="request().status">{{ statusLabel() }}</span>
      </div>
      <dl>
        <div><dt>CPF no perfil</dt><dd class="cpf">{{ cpf() }}</dd></div>
        <div><dt>Documento</dt><dd>{{ documentLabel() }}</dd></div>
        <div><dt>Perfil</dt><dd>{{ role() }}
          @if (request().account_id; as account) { <a [routerLink]="['/sistema/usuarios', account]">Abrir conta</a> }
        </dd></div>
        <div><dt>Enviado em</dt><dd>{{ date(request().submitted_at) }}</dd></div>
      </dl>
      @if (request().status === 'pending') {
        <p class="t-body-sm muted">Confira se o nome e o CPF do documento são os mesmos do perfil e se a foto é de um documento original.</p>
        <div class="actions">
          <button appButton type="button" (click)="decide.emit('approved')">Aprovar</button>
          <button appButton variant="secondary" type="button" (click)="decide.emit('rejected')">Recusar</button>
        </div>
      } @else {
        <p class="decision t-body-sm">{{ statusLabel() }} em {{ date(request().reviewed_at) }}@if (request().rejection_reason; as reason) {: <span>{{ reason }}</span>}</p>
      }
    </div>
  `,
  styles: `
    :host {
      display: grid; gap: var(--space-4) var(--space-6); grid-template-columns: minmax(0, 1fr); padding: var(--space-4) var(--space-6);
      background: var(--surface-raised); border: 1px solid var(--line); border-radius: var(--radius-lg); box-shadow: var(--shadow-card);
    }
    @media (min-width: 720px) { :host:has(.document) { grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr); } }
    .document { display: grid; gap: var(--space-1); margin: 0; }
    .document img { display: block; width: 100%; border-radius: var(--radius-md); background: var(--surface-sunken); }
    .placeholder { display: grid; place-items: center; aspect-ratio: 8 / 5; border-radius: var(--radius-md); background: var(--surface-sunken); }
    .info { display: grid; gap: var(--space-3); align-content: start; }
    .head { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--space-2); }
    h2, p { margin: 0; overflow-wrap: anywhere; }
    .status { padding: 2px var(--space-2); border-radius: var(--radius-pill); font-size: 0.8125rem; font-weight: 700; }
    .status[data-status='pending'] { background: var(--ipe-soft); color: var(--warning); }
    .status[data-status='approved'] { background: var(--info-soft); color: var(--info); }
    .status[data-status='rejected'] { background: var(--surface-sunken); color: var(--ink-muted); }
    dl { display: grid; gap: var(--space-2); margin: 0; }
    dl > div { display: grid; grid-template-columns: 8rem 1fr; gap: var(--space-3); }
    dt { color: var(--ink-muted); font-size: 0.875rem; }
    dd { margin: 0; }
    dd a { margin-left: var(--space-2); color: var(--mata); font-weight: 600; white-space: nowrap; }
    .cpf { font-weight: 700; font-variant-numeric: tabular-nums; letter-spacing: 0.02em; }
    .actions { display: flex; flex-wrap: wrap; gap: var(--space-3); }
    .decision { color: var(--ink-muted); }
    .decision span { color: var(--ink); }
    @media (max-width: 479px) {
      :host { padding: var(--space-4); }
      dl > div { grid-template-columns: 1fr; gap: 0; }
      .actions > button { flex: 1; }
    }
  `
})
export class VerificationRequestCard {
  readonly request = input.required<AdminVerification>();
  readonly decide = output<VerificationDecision>();

  private readonly moderation = inject(ModerationService);
  readonly photoUrl = signal<string | null>(null);
  readonly photoError = signal(false);

  readonly statusLabel = computed(() => STATUS_LABEL[this.request().status]);
  readonly documentLabel = computed(() => DOCUMENT_LABEL[this.request().document_type]);
  readonly role = computed(() => ROLE_LABEL[this.request().role]);
  readonly cpf = computed(() => formatCpf(this.request().cpf));

  constructor() {
    effect(() => {
      const { id, has_document } = this.request();
      untracked(() => this.loadPhoto(id, has_document));
    });
    inject(DestroyRef).onDestroy(() => this.revoke());
  }

  date(iso: string | null): string {
    return iso ? formatDate(iso) : '';
  }

  private loadPhoto(id: number, hasDocument: boolean): void {
    this.revoke();
    this.photoError.set(false);
    if (!hasDocument) return;
    this.moderation.verificationDocument(id).subscribe({
      next: (blob) => this.photoUrl.set(URL.createObjectURL(blob)),
      error: () => this.photoError.set(true)
    });
  }

  private revoke(): void {
    const url = this.photoUrl();
    if (url) URL.revokeObjectURL(url);
    this.photoUrl.set(null);
  }
}
