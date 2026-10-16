import { Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AdminReport } from '@core/models/report.model';
import { ROLE_LABEL } from '@core/session/roles';
import { REPORT_STATUS_LABEL, REPORT_TARGET_LABEL, reasonLabel } from '@shared/domain/utils/reports';
import { Button } from '@shared/ui/button';
import { formatDate } from '@shared/utils/format';

export type ReportDecision = 'resolved' | 'dismissed';

// Uma denúncia na fila da equipe: o motivo, quem e o que foi denunciado (com o atalho para a conta,
// onde a equipe edita ou remove o perfil), o relato e a decisão.
@Component({
  selector: 'app-report-card',
  imports: [RouterLink, Button],
  template: `
    <div class="head">
      <h2 class="t-h3">{{ reason() }}</h2>
      <span class="status" [attr.data-status]="report().status">{{ statusLabel() }}</span>
    </div>
    <dl>
      <div>
        <dt>{{ targetLabel() }}</dt>
        <dd>{{ report().target_name }}
          @if (report().target_account_id; as account) { <a [routerLink]="['/sistema/usuarios', account]">Abrir conta</a> }
        </dd>
      </div>
      <div>
        <dt>Quem denunciou</dt>
        <dd>{{ report().reporter.name }} <span class="muted">({{ reporterRole() }})</span>
          @if (report().reporter.account_id; as account) { <a [routerLink]="['/sistema/usuarios', account]">Abrir conta</a> }
        </dd>
      </div>
      <div><dt>Quando</dt><dd>{{ date(report().insertion_date) }}</dd></div>
    </dl>
    @if (report().details; as details) {
      <blockquote>{{ details }}</blockquote>
    } @else {
      <p class="muted t-body-sm">Sem relato.</p>
    }
    @if (report().status === 'open') {
      <div class="actions">
        <button appButton type="button" (click)="decide.emit('resolved')">Procedente</button>
        <button appButton variant="secondary" type="button" (click)="decide.emit('dismissed')">Descartar</button>
      </div>
    } @else {
      <p class="decision t-body-sm">
        {{ statusLabel() }} em {{ date(report().reviewed_at) }}@if (report().resolution_note; as note) {: <span>{{ note }}</span>}
      </p>
    }
  `,
  styles: `
    :host {
      display: grid; gap: var(--space-3); padding: var(--space-4) var(--space-6);
      background: var(--surface-raised); border: 1px solid var(--line); border-radius: var(--radius-lg); box-shadow: var(--shadow-card);
    }
    .head { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--space-2); }
    h2 { margin: 0; }
    .status { padding: 2px var(--space-2); border-radius: var(--radius-pill); font-size: 0.8125rem; font-weight: 700; }
    .status[data-status='open'] { background: var(--ipe-soft); color: var(--warning); }
    .status[data-status='resolved'] { background: var(--success-soft); color: var(--success); }
    .status[data-status='dismissed'] { background: var(--surface-sunken); color: var(--ink-muted); }
    dl { display: grid; gap: var(--space-2); margin: 0; }
    dl > div { display: grid; grid-template-columns: 9.5rem 1fr; gap: var(--space-3); }
    dt { color: var(--ink-muted); font-size: 0.875rem; }
    dd { margin: 0; overflow-wrap: anywhere; }
    dd a { margin-left: var(--space-2); color: var(--mata); font-weight: 600; white-space: nowrap; }
    blockquote { margin: 0; padding: var(--space-2) var(--space-4); border-left: 3px solid var(--line-strong); white-space: pre-line; max-width: 68ch; }
    p { margin: 0; }
    .actions { display: flex; flex-wrap: wrap; gap: var(--space-3); padding-top: var(--space-1); }
    .decision { color: var(--ink-muted); }
    .decision span { color: var(--ink); }
    @media (max-width: 479px) {
      :host { padding: var(--space-4); }
      dl > div { grid-template-columns: 1fr; gap: 0; }
      .actions > button { flex: 1; }
    }
  `
})
export class ReportCard {
  readonly report = input.required<AdminReport>();
  readonly decide = output<ReportDecision>();

  readonly reason = computed(() => reasonLabel(this.report().reason));
  readonly statusLabel = computed(() => REPORT_STATUS_LABEL[this.report().status]);
  readonly targetLabel = computed(() => REPORT_TARGET_LABEL[this.report().target_type]);
  readonly reporterRole = computed(() => ROLE_LABEL[this.report().reporter.role]);

  date(iso: string | null): string {
    return iso ? formatDate(iso) : '';
  }
}
