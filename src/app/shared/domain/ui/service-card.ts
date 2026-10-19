import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FarmPhoto } from '@core/models/farm.model';
import { Service } from '@core/models/service.model';
import { expiryLabel, isExpired } from '../utils/expiry';
import { serviceCover } from '../utils/farm-emoji';
import { formatBRL, formatHours } from '../../utils/format';
import { CategoryChip } from './category-chip';
import { Icon } from '../../ui/icon';
import { StatusBadge } from './status-badge';
import { RatingBadge } from './rating-badge';
import { VerifiedBadge } from './verified-badge';

// A fazenda chega completa no produtor (fotos com id e url) e resumida no trabalhador (só URLs).
type CardFarm = { city: string; state: string; photos: (string | FarmPhoto)[]; reputation?: { average: number | null; count: number }; farmer_verified?: true };
type CardService = Service & { farm?: CardFarm; applications_pending?: number };

// Card de serviço/vaga. O card inteiro é um link para o detalhe.
@Component({
  selector: 'app-service-card',
  imports: [RouterLink, CategoryChip, Icon, RatingBadge, StatusBadge, VerifiedBadge],
  template: `
    <a class="card-link" [routerLink]="link()">
      @if (cover(); as src) {
        <span class="photo">
          <img class="cover" [src]="src" alt="" loading="lazy" decoding="async" />
          <span appCategoryChip class="on-photo">{{ service().category }}</span>
        </span>
      }
      <div class="body">
        @if (own() || expired() || showStatus() || !cover()) {
          <div class="top">
            @if (!cover()) { <span appCategoryChip>{{ service().category }}</span> }
            @if (own()) {
              <span class="own">Sua vaga</span>
            } @else if (expired()) {
              <span class="expired">Prazo encerrado</span>
            } @else if (showStatus()) {
              <app-status-badge [status]="service().status" />
            }
          </div>
        }
        <h3>{{ service().name }}</h3>
        <p class="price">{{ price() }}</p>
        <p class="facts t-body-sm">
          @if (service().farm; as farm) { <span><app-icon name="map-pin" [size]="16" />{{ farm.city }}, {{ farm.state }}</span> }
          <span><app-icon name="clock" [size]="16" />{{ hours() }}</span>
          @if (deadline(); as text) {
            @if (!expired()) { <span class="deadline"><app-icon name="alert" [size]="16" />{{ text }}</span> }
          }
        </p>
        @if (service().farm; as farm) {
          @if (farm.reputation || farm.farmer_verified) {
            <p class="facts t-body-sm">
              @if (farm.reputation; as rep) { <app-rating-badge [reputation]="rep" /> }
              @if (farm.farmer_verified) { <app-verified-badge /> }
            </p>
          }
        }
        @if (reasons().length) {
          <ul class="reasons t-body-sm" role="list" aria-label="Por que combina com você">
            @for (reason of reasons().slice(0, 2); track reason) { <li><app-icon name="check" [size]="16" />{{ reason }}</li> }
          </ul>
        }
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
    .photo { position: relative; display: block; }
    .cover { display: block; width: 100%; aspect-ratio: 16 / 10; object-fit: cover; background: var(--bg-alt); }
    .on-photo { position: absolute; left: var(--space-3); top: var(--space-3); background: var(--surface-raised); box-shadow: var(--shadow-card); }
    .body { display: grid; gap: var(--space-1); align-content: start; padding: var(--space-4) var(--space-4) var(--space-6); }
    .top { display: flex; flex-wrap: wrap; gap: var(--space-2); justify-content: space-between; align-items: center; margin-bottom: var(--space-1); }
    .facts { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-1) var(--space-3); color: var(--ink-muted); margin-top: var(--space-1); }
    .facts > span { display: inline-flex; align-items: center; gap: var(--space-1); }
    .deadline { color: var(--orange-700); font-weight: 600; }
    .expired { padding: 2px var(--space-3); border-radius: var(--radius-pill); background: var(--surface-sunken); color: var(--ink-muted); font-size: 0.875rem; font-weight: 600; }
    .own { padding: 2px var(--space-3); border-radius: var(--radius-pill); background: var(--ipe-soft); font-size: 0.875rem; font-weight: 600; }
    .price { font: 800 1.375rem/1.75rem var(--font-display); font-variant-numeric: tabular-nums; color: var(--money); }
    .reasons { display: grid; gap: 2px; margin: 0; padding: var(--space-2) 0 0; border-top: 1px solid var(--line); list-style: none; color: var(--mata-deep); }
    .reasons li { display: flex; align-items: center; gap: var(--space-1); }
    .pending { justify-self: start; padding: 2px var(--space-3); border-radius: var(--radius-pill); background: var(--ipe-soft); font-weight: 600; }
  `
})
export class ServiceCard {
  readonly service = input.required<CardService>();
  readonly link = input.required<string | unknown[]>();
  readonly showStatus = input(true);
  readonly showCover = input(true);
  // Vaga publicada pelo perfil de produtor da mesma conta (o trabalhador não pode se candidatar).
  readonly own = input(false);
  // Por que a vaga foi sugerida (vagas para você): até dois motivos, embaixo do valor.
  readonly reasons = input<readonly string[]>([]);

  readonly price = computed(() => formatBRL(this.service().price));
  readonly hours = computed(() => formatHours(this.service().duration));
  readonly expired = computed(() => isExpired(this.service()));
  readonly deadline = computed(() => expiryLabel(this.service()));
  readonly cover = computed(() => (this.showCover() ? serviceCover(this.service()) : null));
}
