import { Component, computed, effect, inject, input, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ReviewService } from '@core/api/review.service';
import { UserRole } from '@core/models/auth.model';
import { RemoteData } from '../../utils/remote-data';
import { formatDate } from '../../utils/format';
import { apiAsset } from '../../utils/images';
import { Icon } from '../../ui/icon';
import { Avatar } from './avatar';
import { FarmEmoji } from './farm-emoji';
import { FARM_EMOJIS, pickEmoji } from '../utils/farm-emoji';

// Serviços concluídos esperando a avaliação de quem entrou (no início de cada painel).
// Some quando não há nada para avaliar.
@Component({
  selector: 'app-pending-reviews',
  imports: [RouterLink, Avatar, FarmEmoji, Icon],
  template: `
    @if (items().length) {
      <section class="stack" aria-labelledby="pending-reviews-title">
        <h2 id="pending-reviews-title">Avalie seus últimos serviços</h2>
        <ul class="list" role="list">
          @for (item of items(); track item.service_id) {
            <li>
              <a class="row" [routerLink]="[linkBase(), item.service_id]">
                @if (role() === 'farmer') {
                  <app-avatar [name]="item.subject" [photoUrl]="item.photo_url" [size]="48" />
                } @else if (item.photo_url) {
                  <img class="farm" [src]="asset(item.photo_url)" alt="" width="48" height="48" loading="lazy" />
                } @else {
                  <span class="farm placeholder"><app-farm-emoji [emoji]="farmEmoji(item.service_id)" [size]="28" /></span>
                }
                <span class="what">
                  <span class="t-label">{{ item.subject }}</span>
                  <span class="t-body-sm muted">{{ item.service_name }}. Avalie até {{ date(item.window_ends_at) }}</span>
                </span>
                @if (item.received_hidden) {
                  <span class="waiting"><app-icon name="lock" [size]="16" />Já avaliou você</span>
                }
                <span class="cta">Avaliar<app-icon name="star" [size]="18" /></span>
              </a>
            </li>
          }
        </ul>
      </section>
    }
  `,
  styles: `
    .list { display: grid; gap: var(--space-3); }
    .row {
      display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-3);
      padding: var(--space-3) var(--space-4); border-radius: var(--radius-lg);
      border: 1px solid var(--line); background: var(--surface-raised); box-shadow: var(--shadow-card);
      color: var(--ink); text-decoration: none;
    }
    .row:hover { border-color: var(--line-strong); }
    .farm { width: 48px; height: 48px; border-radius: var(--radius-sm); object-fit: cover; flex: none; }
    .placeholder { display: grid; place-items: center; background: var(--broto-soft); }
    .what { display: grid; flex: 1; min-width: 180px; }
    .waiting { display: inline-flex; align-items: center; gap: var(--space-1); padding: 2px var(--space-3); border-radius: var(--radius-pill); background: var(--ipe-soft); font-size: 14px; font-weight: 600; }
    .cta { display: inline-flex; align-items: center; gap: var(--space-1); color: var(--mata); font-weight: 700; }
  `
})
export class PendingReviews {
  readonly role = input.required<UserRole>();
  readonly profileId = input.required<number>();

  private readonly reviewService = inject(ReviewService);
  readonly pending = new RemoteData(() => this.reviewService.pending(this.role(), this.profileId()));
  readonly items = computed(() => this.pending.data() ?? []);
  readonly linkBase = computed(() => (this.role() === 'farmer' ? '/produtor/servicos' : '/trabalhador/vagas'));
  readonly date = formatDate;

  constructor() {
    effect(() => {
      this.role();
      this.profileId();
      untracked(() => this.pending.load());
    });
  }

  asset(url: string): string {
    return apiAsset(url);
  }

  farmEmoji(seed: number): string {
    return pickEmoji(seed, FARM_EMOJIS);
  }
}
