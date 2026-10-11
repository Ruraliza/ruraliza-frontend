import { Component, computed, input } from '@angular/core';

// Símbolo "R" (grade de 3×4 módulos: arco, perna em diagonal e o quadrado laranja) + wordmark "RURALIZA".
// tone="color": verde-escuro, verde e laranja. Padrão para fundo claro e tamanhos pequenos (header, sidebar).
// tone="vivid": as quatro cores, com o lima. Para o símbolo grande sobre fundo claro.
// tone="reverse": uma cor só (currentColor): branco sobre o verde ou sobre foto.
// O wordmark usa currentColor; por padrão é o verde da marca.
// Mesmo desenho de public/brand/*.svg (gerados por scripts/generate-brand-assets.mjs).
@Component({
  selector: 'app-logo',
  template: `
    <svg [attr.width]="width()" [attr.height]="size()" viewBox="0 0 30 40" aria-hidden="true" focusable="false">
      @switch (tone()) {
        @case ('vivid') {
          <path [attr.d]="paths.bowlLeft" class="mata" />
          <path [attr.d]="paths.bowlRight" class="verde" />
          <path [attr.d]="paths.leg" class="broto" />
          <path [attr.d]="paths.foot" class="ipe" />
        }
        @case ('reverse') {
          <path [attr.d]="paths.bowl + paths.leg + paths.foot" fill="currentColor" />
        }
        @default {
          <path [attr.d]="paths.bowl" class="mata" />
          <path [attr.d]="paths.leg" class="verde" />
          <path [attr.d]="paths.foot" class="ipe" />
        }
      }
    </svg>
    @if (wordmark()) { <span class="wordmark" [style.font-size.px]="wordmarkSize()">RURALIZA</span> }
    @else { <span class="visually-hidden">RURALIZA</span> }
  `,
  styles: `
    :host { display: inline-flex; align-items: center; gap: var(--space-2); color: var(--green-900); }
    svg { flex: none; }
    .mata { fill: #005320; }
    .verde { fill: #017D08; }
    .broto { fill: #89C401; }
    .ipe { fill: #FE8400; }
    .wordmark { font-family: var(--font-display); font-weight: 800; line-height: 1; letter-spacing: 0.01em; }
  `
})
export class Logo {
  // Altura do símbolo, em px.
  readonly size = input(36);
  readonly wordmark = input(true);
  readonly tone = input<'color' | 'vivid' | 'reverse'>('color');

  readonly width = computed(() => (this.size() * 3) / 4);
  // Proporção do wordmark em relação ao símbolo.
  readonly wordmarkSize = computed(() => Math.round(this.size() * 0.6));

  readonly paths = {
    bowl: 'M0 10A10 10 0 0 1 10 0H30V10A10 10 0 0 1 20 20V10H10V20H0Z',
    bowlLeft: 'M0 10A10 10 0 0 1 10 0H20V10H10V20H0Z',
    bowlRight: 'M20 0H30V10A10 10 0 0 1 20 20Z',
    leg: 'M10 20H20L30 30V40H20L10 30Z',
    foot: 'M0 30H10V40H0Z'
  } as const;
}
