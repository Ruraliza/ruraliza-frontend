import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FarmLocation } from '../../../models/farm.model';
import { Service } from '../../../models/service.model';
import { formatBRL, formatHours } from '../utils/format';
import { CategoryChip } from './category-chip';
import { Icon } from './icon';
import { StatusBadge } from './status-badge';

type CardService = Service & { farm?: FarmLocation; applications_pending?: number };

// Card de serviço/vaga. O card inteiro é um link para o detalhe.
@Component({
  selector: 'app-service-card',
  imports: [RouterLink, CategoryChip, Icon, StatusBadge],
  template: `
    <a class="card-link" [routerLink]="link()">
      <div class="top">
        <span appCategoryChip>{{ service().category }}</span>
        @if (showStatus()) { <app-status-badge [status]="service().status" /> }
      </div>
      <h3>{{ service().name }}</h3>
      @if (service().farm; as farm) {
        <p class="meta t-body-sm"><app-icon name="map-pin" [size]="18" />{{ farm.city }}, {{ farm.state }}</p>
      }
      <p class="meta t-body-sm"><app-icon name="clock" [size]="18" />{{ hours() }}</p>
      <p class="price">{{ price() }}</p>
      @if (service().applications_pending) {
        <p class="pending t-body-sm">
          {{ service().applications_pending }} {{ service().applications_pending === 1 ? 'candidatura' : 'candidaturas' }} para analisar
        </p>
      }
    </a>
  `,
  styles: `
    :host { display: block; }
    .card-link {
      display: grid; gap: var(--space-2); height: 100%;
      padding: var(--space-6); border-radius: var(--radius-lg);
      background: var(--surface-raised); border: 1px solid var(--line); box-shadow: var(--shadow-card);
      color: var(--ink); text-decoration: none;
    }
    .card-link:hover { border-color: var(--line-strong); }
    .top { display: flex; flex-wrap: wrap; gap: var(--space-2); justify-content: space-between; align-items: center; margin-bottom: var(--space-1); }
    .meta { display: flex; align-items: center; gap: var(--space-2); color: var(--ink-muted); }
    .price { font: 700 24px/30px var(--font-display); font-variant-numeric: tabular-nums; margin-top: var(--space-1); }
    .pending { justify-self: start; padding: 2px var(--space-3); border-radius: var(--radius-pill); background: var(--ipe-soft); font-weight: 600; }
  `
})
export class ServiceCard {
  readonly service = input.required<CardService>();
  readonly link = input.required<string | unknown[]>();
  readonly showStatus = input(true);

  readonly price = computed(() => formatBRL(this.service().price));
  readonly hours = computed(() => formatHours(this.service().duration));
}
