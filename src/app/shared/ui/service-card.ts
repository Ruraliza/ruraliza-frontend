import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FarmPhoto } from '../../../models/farm.model';
import { Service } from '../../../models/service.model';
import { expiryLabel, isExpired } from '../utils/expiry';
import { formatBRL, formatHours } from '../utils/format';
import { apiAsset } from '../utils/images';
import { CategoryChip } from './category-chip';
import { Icon } from './icon';
import { StatusBadge } from './status-badge';

// A fazenda chega completa no produtor (fotos com id e url) e resumida no trabalhador (só URLs).
type CardFarm = { city: string; state: string; photos: (string | FarmPhoto)[] };
type CardService = Service & { farm?: CardFarm; applications_pending?: number };

// Card de serviço/vaga. O card inteiro é um link para o detalhe.
@Component({
  selector: 'app-service-card',
  imports: [RouterLink, CategoryChip, Icon, StatusBadge],
  template: `
    <a class="card-link" [routerLink]="link()">
      @if (cover(); as src) {
        <img class="cover" [src]="src" alt="" loading="lazy" decoding="async" />
      }
      <div class="body">
        <div class="top">
          <span appCategoryChip>{{ service().category }}</span>
          @if (expired()) {
            <span class="expired">Prazo encerrado</span>
          } @else if (showStatus()) {
            <app-status-badge [status]="service().status" />
          }
        </div>
        <h3>{{ service().name }}</h3>
        @if (service().farm; as farm) {
          <p class="meta t-body-sm"><app-icon name="map-pin" [size]="18" />{{ farm.city }}, {{ farm.state }}</p>
        }
        <p class="meta t-body-sm"><app-icon name="clock" [size]="18" />{{ hours() }}</p>
        @if (deadline(); as text) {
          @if (!expired()) { <p class="meta t-body-sm deadline"><app-icon name="alert" [size]="18" />{{ text }}</p> }
        }
        <p class="price">{{ price() }}</p>
        @if (service().applications_pending) {
          <p class="pending t-body-sm">
            {{ service().applications_pending }} {{ service().applications_pending === 1 ? 'candidatura' : 'candidaturas' }} para analisar
          </p>
        }
      </div>
    </a>
  `,
  styles: `
    :host { display: block; }
    .card-link {
      display: grid; grid-template-rows: auto 1fr; height: 100%; overflow: hidden;
      border-radius: var(--radius-lg);
      background: var(--surface-raised); border: 1px solid var(--line); box-shadow: var(--shadow-card);
      color: var(--ink); text-decoration: none;
    }
    .card-link:hover { border-color: var(--line-strong); }
    .cover { width: 100%; aspect-ratio: 16 / 9; object-fit: cover; background: var(--bg-alt); }
    .body { display: grid; gap: var(--space-2); align-content: start; padding: var(--space-6); }
    .top { display: flex; flex-wrap: wrap; gap: var(--space-2); justify-content: space-between; align-items: center; margin-bottom: var(--space-1); }
    .meta { display: flex; align-items: center; gap: var(--space-2); color: var(--ink-muted); }
    .deadline { color: var(--orange-700); font-weight: 600; }
    .expired { padding: 2px var(--space-3); border-radius: var(--radius-pill); background: var(--surface-sunken); color: var(--ink-muted); font-size: 14px; font-weight: 600; }
    .price { font: 700 24px/30px var(--font-display); font-variant-numeric: tabular-nums; margin-top: var(--space-1); }
    .pending { justify-self: start; padding: 2px var(--space-3); border-radius: var(--radius-pill); background: var(--ipe-soft); font-weight: 600; }
  `
})
export class ServiceCard {
  readonly service = input.required<CardService>();
  readonly link = input.required<string | unknown[]>();
  readonly showStatus = input(true);
  readonly showCover = input(true);

  readonly price = computed(() => formatBRL(this.service().price));
  readonly hours = computed(() => formatHours(this.service().duration));
  readonly expired = computed(() => isExpired(this.service()));
  readonly deadline = computed(() => expiryLabel(this.service()));
  readonly cover = computed(() => {
    const first = this.showCover() ? this.service().farm?.photos[0] : undefined;
    if (first === undefined) return null;
    return apiAsset(typeof first === 'string' ? first : first.url);
  });
}
