import { Component, ElementRef, afterRenderEffect, computed, effect, inject, input, output, untracked, viewChild } from '@angular/core';
import { Observable, of } from 'rxjs';
import { ReviewService } from '@core/api/review.service';
import { FarmReviewsPage, WorkerReviewsPage } from '@core/models/review.model';
import { RemoteData } from '../../utils/remote-data';
import { formatDate } from '../../utils/format';
import { Button } from '../../ui/button';
import { Skeleton } from '../../ui/skeleton';
import { FARM_CRITERIA, WORKER_CRITERIA, formatRating, reviewCount } from '../utils/review-criteria';
import { RatingBadge } from './rating-badge';
import { ReviewScores } from './review-scores';

// Quem está sendo visto: um trabalhador (pelo produtor) ou uma fazenda (pelo trabalhador).
export interface ReputationTarget {
  kind: 'worker' | 'farm';
  id: number;
  name: string; // "Maria Trabalhadora" ou "Fazenda em Três Rios, RJ"
}

type Page = WorkerReviewsPage | FarmReviewsPage;

// Reputação em <dialog> modal: média, uma barra por critério e as avaliações publicadas com
// comentário. Aberto enquanto `target` não for null.
@Component({
  selector: 'app-reputation-dialog',
  imports: [Button, RatingBadge, ReviewScores, Skeleton],
  template: `
    <dialog #dialog aria-labelledby="reputation-title" (cancel)="onCancel($event)">
      <div class="head">
        <h2 id="reputation-title">Avaliações de {{ target()?.name }}</h2>
        <button appButton variant="ghost" type="button" (click)="closed.emit()">Fechar</button>
      </div>
      <div class="body">
        @switch (page.state().status) {
          @case ('loading') { <app-skeleton [count]="2" [height]="96" /> }
          @case ('error') { <p class="muted">{{ page.error() }}</p> }
          @case ('success') {
            @if (page.data(); as p) {
              @if (p.reputation.count === 0) {
                <p class="muted">Ainda não há avaliações publicadas. Elas aparecem depois que um serviço é concluído e os dois lados avaliam.</p>
              } @else {
                <div class="summary">
                  <app-rating-badge [reputation]="p.reputation" size="large" />
                  <p class="t-body-sm muted">{{ count(p.reputation.count) }}</p>
                </div>
                <dl class="bars">
                  @for (bar of bars(); track bar.label) {
                    <div>
                      <dt>{{ bar.label }}</dt>
                      <dd>
                        <span class="track" aria-hidden="true"><span class="fill" [style.width.%]="bar.percent"></span></span>
                        <span class="value">{{ bar.text }}</span>
                      </dd>
                    </div>
                  }
                </dl>
                <ul class="list" role="list">
                  @for (review of p.reviews; track review.id) {
                    <li>
                      <p class="who t-body-sm"><strong>{{ review.author }}</strong><span class="muted">{{ review.service_name }}, {{ date(review.insertion_date) }}</span></p>
                      <app-review-scores [review]="review" />
                    </li>
                  }
                </ul>
              }
            }
          }
        }
      </div>
    </dialog>
  `,
  styles: `
    dialog {
      width: min(560px, calc(100vw - 2 * var(--space-4)));
      max-height: calc(100dvh - 2 * var(--space-4));
      padding: 0; border: 0; border-radius: var(--radius-lg);
      background: var(--surface-raised); color: var(--ink); box-shadow: var(--shadow-float);
    }
    dialog::backdrop { background: var(--scrim); }
    dialog[open] { display: grid; grid-template-rows: auto minmax(0, 1fr); }
    .head { display: flex; align-items: center; justify-content: space-between; gap: var(--space-3); padding: var(--space-4) var(--space-6); border-bottom: 1px solid var(--line); }
    h2 { margin: 0; font-size: 1.25rem; line-height: 1.625rem; overflow-wrap: anywhere; }
    .body { display: grid; gap: var(--space-6); align-content: start; padding: var(--space-6); overflow-y: auto; }
    .summary { display: grid; gap: var(--space-1); }
    .summary p { margin: 0; }
    .bars { display: grid; gap: var(--space-2); margin: 0; }
    .bars > div { display: grid; grid-template-columns: minmax(120px, 40%) 1fr; align-items: center; gap: var(--space-3); }
    dt { font-size: 0.875rem; color: var(--ink-muted); }
    dd { display: flex; align-items: center; gap: var(--space-2); margin: 0; }
    .track { flex: 1; height: 8px; border-radius: var(--radius-pill); background: var(--surface-sunken); overflow: hidden; }
    .fill { display: block; height: 100%; border-radius: inherit; background: var(--gold-500); }
    .value { min-width: 2.5em; text-align: right; font-weight: 700; font-variant-numeric: tabular-nums; }
    .list { display: grid; gap: var(--space-4); }
    .list li { display: grid; gap: var(--space-2); padding-top: var(--space-4); border-top: 1px solid var(--line); }
    .who { display: grid; margin: 0; }
    @media (max-width: 479px) {
      .head, .body { padding-inline: var(--space-4); }
      .bars > div { grid-template-columns: 1fr; gap: var(--space-1); }
    }
  `
})
export class ReputationDialog {
  readonly target = input.required<ReputationTarget | null>();
  readonly closed = output<void>();

  private readonly reviewService = inject(ReviewService);
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  readonly page = new RemoteData<Page | null>(() => this.fetch());
  readonly date = formatDate;
  readonly count = reviewCount;

  readonly bars = computed(() => {
    const page = this.page.data();
    if (!page) return [];
    const reputation = page.reputation;
    const rows = 'punctuality' in reputation
      ? WORKER_CRITERIA.map((c) => ({ label: c.label, value: reputation[c.key] }))
      : FARM_CRITERIA.map((c) => ({ label: c.label, value: (reputation as FarmReviewsPage['reputation'])[c.key] }));
    return rows.map((row) => ({
      label: row.label,
      percent: row.value === null ? 0 : (row.value / 5) * 100,
      text: row.value === null ? '–' : formatRating(row.value)
    }));
  });

  constructor() {
    // Carrega ao abrir (ou ao trocar de pessoa/fazenda).
    effect(() => {
      if (this.target()) untracked(() => this.page.load());
    });
    afterRenderEffect(() => {
      const element = this.dialog().nativeElement;
      const open = this.target() !== null;
      if (open && !element.open) element.showModal();
      if (!open && element.open) element.close();
    });
  }

  onCancel(event: Event): void {
    event.preventDefault();
    this.closed.emit();
  }

  private fetch(): Observable<Page | null> {
    const target = this.target();
    if (!target) return of(null);
    return target.kind === 'worker' ? this.reviewService.workerReviews(target.id) : this.reviewService.farmReviews(target.id);
  }
}
