import { Component, computed, input, output } from '@angular/core';
import { SponsorCard } from '@core/models/sponsor.model';
import { apiAsset } from '../../utils/images';

// O cartão "Patrocinado" em si (sem buscar nada): usado no Início e na prévia da gestão de patrocínios.
// Sempre identificado como anúncio (exigência do Código de Defesa do Consumidor).
@Component({
  selector: 'app-sponsor-card',
  template: `
    @let c = card();
    <aside class="sponsor" aria-label="Patrocinado">
      <div class="head">
        <span class="label t-body-sm">Patrocinado</span>
        @if (image(); as src) { <img [src]="src" [alt]="'Logo de ' + c.sponsor" loading="lazy" decoding="async" /> }
      </div>
      <p class="t-body-sm muted name">{{ c.sponsor }}</p>
      <p class="title">{{ c.title }}</p>
      @if (c.text) { <p class="t-body-sm muted">{{ c.text }}</p> }
      <div class="foot">
        <a class="cta" [href]="c.url" target="_blank" rel="sponsored noopener noreferrer" (click)="opened.emit(c)">{{ c.cta_label }}<span class="visually-hidden"> (abre o site do anunciante)</span></a>
        <details>
          <summary class="t-body-sm">Por que vejo isto?</summary>
          <p class="t-body-sm muted">Empresas do campo apoiam o Ruraliza com este espaço. O anunciante não recebe nenhum dado seu: o app só mostra o cartão.</p>
        </details>
      </div>
    </aside>
  `,
  styles: `
    .sponsor {
      display: grid; gap: var(--space-1); padding: var(--space-4) var(--space-6);
      border: 1px dashed var(--line-strong); border-radius: var(--radius-lg); background: var(--surface-sunken);
    }
    .head { display: flex; align-items: center; justify-content: space-between; gap: var(--space-3); }
    .label { padding: 0 var(--space-2); border-radius: var(--radius-pill); background: var(--surface-raised); color: var(--ink-muted); font-weight: 700; }
    img { max-height: 40px; max-width: 120px; object-fit: contain; border-radius: var(--radius-sm); }
    p { margin: 0; }
    .name { font-weight: 600; }
    .title { font: 700 1.0625rem/1.5rem var(--font-display); overflow-wrap: anywhere; }
    .foot { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--space-2) var(--space-4); padding-top: var(--space-2); }
    .cta {
      display: inline-flex; align-items: center; min-height: 44px; padding: 0 var(--space-4); border-radius: var(--radius-pill);
      border: 1px solid var(--line-strong); background: var(--surface-raised); color: var(--ink); font-weight: 600; text-decoration: none;
    }
    .cta:hover { border-color: var(--ink-muted); }
    details { max-width: 32rem; }
    summary { min-height: 44px; display: flex; align-items: center; color: var(--ink-muted); cursor: pointer; text-decoration: underline; text-underline-offset: 3px; }
    @media (max-width: 479px) { .sponsor { padding: var(--space-4); } }
  `
})
export class SponsorCardView {
  readonly card = input.required<SponsorCard>();
  readonly opened = output<SponsorCard>();

  readonly image = computed(() => {
    const url = this.card().image_url;
    return url ? apiAsset(url) : null;
  });
}
