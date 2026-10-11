import { Component, computed, input } from '@angular/core';
import { FarmReview, WorkerReview } from '@core/models/review.model';
import { FARM_CRITERIA, WORKER_CRITERIA } from '../utils/review-criteria';

// Uma avaliação: a nota de cada critério em estrelas pequenas e o comentário.
@Component({
  selector: 'app-review-scores',
  template: `
    <dl>
      @for (row of rows(); track row.label) {
        <div>
          <dt>{{ row.label }}</dt>
          <dd [attr.aria-label]="row.value + ' de 5'">
            @for (n of five; track n) {
              <svg aria-hidden="true" viewBox="0 0 24 24" [class.on]="n <= row.value"><path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z" /></svg>
            }
          </dd>
        </div>
      }
    </dl>
    @if (review().comment; as comment) {
      <blockquote>{{ comment }}</blockquote>
    }
  `,
  styles: `
    :host { display: grid; gap: var(--space-3); }
    dl { display: grid; gap: var(--space-1); margin: 0; }
    dl > div { display: flex; justify-content: space-between; align-items: center; gap: var(--space-3); }
    dt { color: var(--ink-muted); font-size: 14px; }
    dd { display: flex; gap: 1px; margin: 0; }
    svg { width: 16px; height: 16px; fill: transparent; stroke: var(--line-strong); stroke-width: 1.5; stroke-linejoin: round; }
    svg.on { fill: var(--orange-500); stroke: var(--orange-700); }
    blockquote { margin: 0; padding-left: var(--space-3); border-left: 3px solid var(--broto); white-space: pre-line; overflow-wrap: anywhere; }
  `
})
export class ReviewScores {
  readonly review = input.required<WorkerReview | FarmReview>();

  readonly five = [1, 2, 3, 4, 5];
  readonly rows = computed(() => {
    const review = this.review();
    if ('punctuality' in review) return WORKER_CRITERIA.map((c) => ({ label: c.label, value: review[c.key] }));
    return FARM_CRITERIA.map((c) => ({ label: c.label, value: review[c.key] }));
  });
}
