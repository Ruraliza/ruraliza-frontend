import { Component, input } from '@angular/core';

// Recorte de "talhão": a área é dividida em faixas curvas, como as linhas de plantio
// do símbolo. As máscaras usam unidades relativas à caixa, então acompanham qualquer tamanho.
// Uso: <app-talhao-defs /> uma vez na página; depois `clip-path: url(#talhao-a)` numa foto.
@Component({
  selector: 'app-talhao-defs',
  host: { 'aria-hidden': 'true' },
  styles: `:host { position: absolute; width: 0; height: 0; overflow: hidden; }`,
  template: `
    <svg width="0" height="0" focusable="false">
      <defs>
        <clipPath id="talhao-a" clipPathUnits="objectBoundingBox">
          <path d="M0.035,0 H0.5 C0.43,0.36 0.29,0.72 0.1,1 H0.035 C0.016,1 0,0.975 0,0.95 V0.05 C0,0.022 0.016,0 0.035,0 Z" />
          <path d="M0.54,0 H0.78 C0.7,0.4 0.54,0.74 0.36,1 H0.14 C0.33,0.72 0.47,0.37 0.54,0 Z" />
          <path d="M0.82,0 H0.965 C0.984,0 1,0.022 1,0.05 V0.95 C1,0.975 0.984,1 0.965,1 H0.4 C0.58,0.74 0.74,0.4 0.82,0 Z" />
        </clipPath>
        <clipPath id="talhao-b" clipPathUnits="objectBoundingBox">
          <path d="M0.035,0 H0.6 C0.5,0.3 0.34,0.6 0.18,1 H0.035 C0.016,1 0,0.975 0,0.95 V0.05 C0,0.022 0.016,0 0.035,0 Z" />
          <path d="M0.64,0 H0.965 C0.984,0 1,0.022 1,0.05 V0.95 C1,0.975 0.984,1 0.965,1 H0.22 C0.38,0.6 0.54,0.3 0.64,0 Z" />
        </clipPath>
      </defs>
    </svg>
  `
})
export class TalhaoDefs {}

// Padrão decorativo de faixas curvas para blocos de cor.
@Component({
  selector: 'app-talhao-pattern',
  host: { 'aria-hidden': 'true' },
  styles: `
    :host { position: absolute; inset: 0; overflow: hidden; pointer-events: none; color: var(--pattern-color, currentColor); }
    svg { width: 100%; height: 100%; }
    path { fill: none; stroke: currentColor; stroke-width: 2; vector-effect: non-scaling-stroke; opacity: var(--pattern-opacity, .5); }
  `,
  template: `
    <svg viewBox="0 0 400 400" preserveAspectRatio="xMidYMid slice" focusable="false">
      @for (x of rows; track x) {
        <path [attr.d]="'M' + x + ',400 C' + (x + 40) + ',260 ' + (x + 150) + ',140 ' + (x + 260) + ',0'" />
      }
    </svg>
  `
})
export class TalhaoPattern {
  readonly density = input(14);
  get rows(): number[] {
    return Array.from({ length: this.density() }, (_, i) => -260 + i * (660 / this.density()));
  }
}
