import { Component, computed, input } from '@angular/core';

let nextId = 0;

// Símbolo (sol sobre a lavoura: céu laranja, horizonte e sulcos em perspectiva, campo verde e lima)
// + wordmark "RURALIZA".
// tone="color": símbolo nas cores da marca, para fundos claros ou foto.
// tone="reverse": símbolo de uma cor só (currentColor) com os sulcos vazados, para fundo verde/escuro.
// O wordmark usa currentColor; por padrão é o verde da marca.
@Component({
  selector: 'app-logo',
  template: `
    <svg [attr.width]="size()" [attr.height]="size()" viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <defs>
        <clipPath [attr.id]="clipId"><circle cx="32" cy="32" r="30" /></clipPath>
        @if (tone() === 'reverse') {
          <mask [attr.id]="maskId">
            <rect width="64" height="64" fill="#fff" />
            <path [attr.d]="paths.horizon" fill="#000" />
            <path [attr.d]="paths.furrowLeft" fill="#000" />
            <path [attr.d]="paths.furrowRight" fill="#000" />
          </mask>
        }
      </defs>
      <g [attr.clip-path]="clipUrl">
        @if (tone() === 'reverse') {
          <rect width="64" height="64" fill="currentColor" [attr.mask]="maskUrl" />
        } @else {
          <rect width="64" height="64" class="field" />
          <path [attr.d]="paths.sky" class="sky" />
          <path [attr.d]="paths.meadow" class="meadow" />
          <path [attr.d]="paths.horizon" class="furrow" />
          <path [attr.d]="paths.furrowLeft" class="furrow" />
          <path [attr.d]="paths.furrowRight" class="furrow" />
        }
      </g>
    </svg>
    @if (wordmark()) { <span class="wordmark" [style.font-size.px]="wordmarkSize()">RURALIZA</span> }
    @else { <span class="visually-hidden">RURALIZA</span> }
  `,
  styles: `
    :host { display: inline-flex; align-items: center; gap: var(--space-2); color: var(--green-900); }
    svg { flex: none; }
    .field { fill: var(--green-900); }
    .sky { fill: var(--orange-500); }
    .meadow { fill: var(--lime-500); }
    .furrow { fill: #fff; }
    .wordmark { font-family: var(--font-display); font-weight: 800; line-height: 1; letter-spacing: 0.01em; }
  `
})
export class Logo {
  readonly size = input(36);
  readonly wordmark = input(true);
  readonly tone = input<'color' | 'reverse'>('color');

  // Proporção do wordmark em relação ao símbolo (como no manual da marca).
  readonly wordmarkSize = computed(() => Math.round(this.size() * 0.64));

  // Ids únicos: header e rodapé podem ter o logo na mesma página.
  private readonly uid = nextId++;
  readonly clipId = `logo-clip-${this.uid}`;
  readonly maskId = `logo-mask-${this.uid}`;
  readonly clipUrl = `url(#${this.clipId})`;
  readonly maskUrl = `url(#${this.maskId})`;

  // Mesmo desenho de public/favicon.svg.
  readonly paths = {
    sky: 'M0 0H64V25C44 23.5 21 26.5 0 33Z',
    horizon: 'M0 33C21 26.5 44 23.5 64 25V28C44 26.6 22 29.5 0 36.4Z',
    furrowLeft: 'M45 28.7C31 31 15 37 0 45.5V50.5C15 41.5 31 34.5 49.5 29.1Z',
    furrowRight: 'M53.5 28.3C42 32 32.5 45 26 64H32.5C38 47.5 46 35 58.5 28.5Z',
    meadow: 'M58.5 28.5C46 35 38 47.5 32.5 64H64V28Z'
  } as const;
}
