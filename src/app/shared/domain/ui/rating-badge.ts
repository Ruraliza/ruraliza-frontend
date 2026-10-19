import { Component, computed, input } from '@angular/core';
import { formatRating, ratingLabel } from '../utils/review-criteria';

// Nota publicada de um trabalhador ou de uma fazenda: estrela, média e quantidade.
// Sem avaliações, diz isso (sem estrela vazia, que pareceria nota baixa).
@Component({
  selector: 'app-rating-badge',
  host: { role: 'img', '[attr.aria-label]': 'label()', '[class.empty]': 'empty()', '[class.large]': 'size() === "large"' },
  template: `
    @if (empty()) {
      <span aria-hidden="true">Sem avaliações ainda</span>
    } @else {
      <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z" /></svg>
      <strong aria-hidden="true">{{ average() }}</strong>
      <span class="count" aria-hidden="true">({{ reputation().count }})</span>
    }
  `,
  styles: `
    :host { display: inline-flex; align-items: center; gap: var(--space-1); font-size: 0.9375rem; line-height: 1.25rem; color: var(--ink); white-space: nowrap; }
    :host(.empty) { color: var(--ink-muted); font-size: 0.875rem; }
    svg { width: 18px; height: 18px; fill: var(--gold-500); stroke: var(--gold-700); stroke-width: 1; stroke-linejoin: round; }
    strong { font-weight: 700; font-variant-numeric: tabular-nums; }
    .count { color: var(--ink-muted); font-variant-numeric: tabular-nums; }
    :host(.large) { font-size: 1.125rem; line-height: 1.5rem; }
    :host(.large) svg { width: 22px; height: 22px; }
  `
})
export class RatingBadge {
  readonly reputation = input.required<{ average: number | null; count: number }>();
  readonly size = input<'small' | 'large'>('small');

  readonly empty = computed(() => this.reputation().average === null);
  readonly average = computed(() => {
    const average = this.reputation().average;
    return average === null ? '' : formatRating(average);
  });
  readonly label = computed(() => ratingLabel(this.reputation()));
}
