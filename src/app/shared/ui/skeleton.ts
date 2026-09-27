import { Component, input } from '@angular/core';

// Placeholder de carregamento. `count` blocos de `height` px.
@Component({
  selector: 'app-skeleton',
  host: { 'aria-busy': 'true', role: 'status' },
  template: `
    <span class="visually-hidden">Carregando…</span>
    @for (item of items(); track $index) {
      <div class="block" [style.height.px]="height()"></div>
    }
  `,
  styles: `
    :host { display: grid; gap: var(--space-4); }
    .block {
      border-radius: var(--radius-lg);
      background: linear-gradient(90deg, var(--surface-sunken) 0%, var(--surface-raised) 50%, var(--surface-sunken) 100%);
      background-size: 200% 100%;
      animation: shimmer 1.4s ease-in-out infinite;
    }
    @keyframes shimmer { from { background-position: 100% 0; } to { background-position: -100% 0; } }
  `
})
export class Skeleton {
  readonly count = input(3);
  readonly height = input(120);

  items(): number[] {
    return Array.from({ length: this.count() }, (_, i) => i);
  }
}
