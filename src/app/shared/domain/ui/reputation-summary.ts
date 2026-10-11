import { Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { Observable } from 'rxjs';
import { ReviewService } from '@core/api/review.service';
import { FarmReviewsPage, WorkerReviewsPage } from '@core/models/review.model';
import { RemoteData } from '../../utils/remote-data';
import { RatingBadge } from './rating-badge';
import { ReputationDialog, ReputationTarget } from './reputation-dialog';

// A nota publicada de um trabalhador ou de uma fazenda, com "Ver avaliações" (abre o diálogo).
// Usada onde a reputação não vem junto com os dados da tela (perfil, lista de fazendas).
@Component({
  selector: 'app-reputation-summary',
  imports: [RatingBadge, ReputationDialog],
  template: `
    @if (page.data(); as p) {
      <app-rating-badge [reputation]="p.reputation" [size]="size()" />
      @if (p.reputation.count > 0) {
        <button type="button" class="link" (click)="open.set(true)">Ver avaliações</button>
      }
      <app-reputation-dialog [target]="open() ? target() : null" (closed)="open.set(false)" />
    }
  `,
  styles: `
    :host { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-1) var(--space-3); }
    .link { padding: 0; border: 0; background: none; color: var(--mata); text-decoration: underline; text-underline-offset: 3px; font-weight: 600; cursor: pointer; }
  `
})
export class ReputationSummary {
  readonly kind = input.required<'worker' | 'farm'>();
  readonly id = input.required<number>();
  readonly name = input.required<string>();
  readonly size = input<'small' | 'large'>('small');

  private readonly reviewService = inject(ReviewService);
  readonly page = new RemoteData<WorkerReviewsPage | FarmReviewsPage>(() => this.fetch());
  readonly open = signal(false);
  readonly target = computed<ReputationTarget>(() => ({ kind: this.kind(), id: this.id(), name: this.name() }));

  constructor() {
    effect(() => {
      this.kind();
      this.id();
      untracked(() => this.page.load());
    });
  }

  private fetch(): Observable<WorkerReviewsPage | FarmReviewsPage> {
    return this.kind() === 'worker' ? this.reviewService.workerReviews(this.id()) : this.reviewService.farmReviews(this.id());
  }
}
