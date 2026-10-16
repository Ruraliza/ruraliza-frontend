import { Component, computed, effect, inject, output, signal } from '@angular/core';
import { ModerationService } from '../data-access/moderation.service';
import { ReportCard, ReportDecision } from './report-card';
import { ReviewReportDialog, ReviewRequest } from './review-report-dialog';
import { AdminReport } from '@core/models/report.model';
import { ToastService } from '@core/toast/toast.service';
import { EmptyState } from '@shared/ui/empty-state';
import { ErrorState } from '@shared/ui/error-state';
import { Icon } from '@shared/ui/icon';
import { Skeleton } from '@shared/ui/skeleton';
import { RemoteData } from '@shared/utils/remote-data';

// Fila de denúncias: as em análise e, recolhidas embaixo, as já decididas. Remover ou editar a conta
// é feito em Usuários (cada denúncia tem o atalho para as duas contas). `pendingCount` vai para a aba.
@Component({
  selector: 'app-reports-queue',
  imports: [EmptyState, ErrorState, Icon, ReportCard, ReviewReportDialog, Skeleton],
  template: `
    @switch (reports.state().status) {
      @case ('loading') { <app-skeleton [count]="2" [height]="180" /> }
      @case ('error') { <app-error-state [message]="reports.error()" (retry)="reports.load()" /> }
      @case ('success') {
        @if (open().length) {
          <ul class="list" role="list">
            @for (report of open(); track report.id) {
              <li><app-report-card [report]="report" (decide)="ask(report, $event)" /></li>
            }
          </ul>
        } @else {
          <app-empty-state icon="shield" title="Nenhuma denúncia em análise" message="Quando alguém denunciar uma vaga ou um perfil, a denúncia aparece aqui." />
        }

        @if (decided().length) {
          <details class="history">
            <summary><app-icon name="plus" [size]="20" />Já decididas ({{ decided().length }})</summary>
            <ul class="list" role="list">
              @for (report of decided(); track report.id) {
                <li><app-report-card [report]="report" /></li>
              }
            </ul>
          </details>
        }
      }
    }

    <app-review-report-dialog [request]="request()" [loading]="saving()" (confirmed)="decide($event)" (cancelled)="request.set(null)" />
  `,
  styles: `
    :host { display: grid; gap: var(--space-4); max-width: 760px; }
    .list { display: grid; gap: var(--space-3); margin: 0; padding: 0; list-style: none; }
    .history { display: grid; gap: var(--space-3); }
    summary { min-height: 44px; display: flex; align-items: center; gap: var(--space-2); font-weight: 600; color: var(--mata); cursor: pointer; list-style: none; }
    summary::-webkit-details-marker { display: none; }
    summary app-icon { transition: transform .2s var(--ease-out); }
    .history[open] summary app-icon { transform: rotate(45deg); }
    .history[open] summary { margin-bottom: var(--space-3); }
  `
})
export class ReportsQueue {
  readonly pendingCount = output<number>();

  private readonly moderation = inject(ModerationService);
  private readonly toast = inject(ToastService);

  readonly reports = new RemoteData<AdminReport[]>(() => this.moderation.reports());
  readonly request = signal<ReviewRequest | null>(null);
  readonly saving = signal(false);

  // A API manda a mais recente primeiro; as decididas, pela decisão mais recente.
  readonly open = computed(() => (this.reports.data() ?? []).filter((r) => r.status === 'open'));
  readonly decided = computed(() =>
    (this.reports.data() ?? []).filter((r) => r.status !== 'open').sort((a, b) => (b.reviewed_at ?? '').localeCompare(a.reviewed_at ?? ''))
  );

  constructor() {
    this.reports.load();
    effect(() => this.pendingCount.emit(this.open().length));
  }

  ask(report: AdminReport, decision: ReportDecision): void {
    this.request.set({ report, decision });
  }

  decide(note: string): void {
    const request = this.request();
    if (!request) return;
    this.saving.set(true);
    this.moderation.review(request.report.id, { status: request.decision, note: note || null }).subscribe({
      next: ({ report }) => {
        this.saving.set(false);
        this.request.set(null);
        this.reports.replace((this.reports.data() ?? []).map((r) => (r.id === report.id ? report : r)));
        this.toast.success(report.status === 'resolved' ? 'Denúncia marcada como procedente.' : 'Denúncia descartada.');
      },
      error: () => {
        // Já decidida por outra pessoa da equipe (409) ou removida: a mensagem saiu no toast; mostra a fila atual.
        this.saving.set(false);
        this.request.set(null);
        this.reports.refresh();
      }
    });
  }
}
