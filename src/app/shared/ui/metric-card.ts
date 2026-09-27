import { Component, input } from '@angular/core';

// Número grande de painel. Variante "hero" em mata-deep para a métrica mais importante.
@Component({
  selector: 'app-metric-card',
  host: { '[class.hero]': 'variant() === "hero"' },
  template: `
    <p class="t-label label">{{ label() }}</p>
    <p class="t-metric">{{ value() }}</p>
    @if (hint()) { <p class="t-body-sm hint">{{ hint() }}</p> }
  `,
  styles: `
    :host {
      display: grid; gap: var(--space-1); align-content: start;
      padding: var(--space-6); border-radius: var(--radius-lg);
      background: var(--surface-raised); border: 1px solid var(--line); box-shadow: var(--shadow-card);
    }
    .label, .hint { color: var(--ink-muted); }
    :host(.hero) { background: var(--mata-deep); border-color: var(--mata-deep); color: var(--on-mata); }
    :host(.hero) .label, :host(.hero) .hint { color: inherit; opacity: .85; }
  `
})
export class MetricCard {
  readonly label = input.required<string>();
  readonly value = input.required<number | string>();
  readonly hint = input<string>('');
  readonly variant = input<'default' | 'hero'>('default');
}
