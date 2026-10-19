import { Component, input } from '@angular/core';

// Cartão da próxima ação no topo do Início: uma coisa só para fazer agora, com o botão por projeção.
@Component({
  selector: 'app-next-step',
  template: `
    <div class="text">
      <span class="status">{{ status() }}</span>
      <h2>{{ title() }}</h2>
      @if (place()) { <p class="muted">{{ place() }}</p> }
    </div>
    @if (photo(); as src) { <img [src]="src" alt="" decoding="async" /> }
    <div class="action"><ng-content /></div>
  `,
  styles: `
    :host {
      display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: var(--space-4);
      padding: var(--space-6) var(--space-4) var(--space-4); border-radius: var(--radius-lg);
      background: var(--broto-soft); box-shadow: var(--shadow-card);
    }
    .text { display: grid; gap: var(--space-1); align-content: start; min-width: 0; }
    .status {
      justify-self: start; padding: 2px var(--space-3); border-radius: var(--radius-pill);
      background: var(--gold-500); color: var(--on-accent); font-size: 0.875rem; font-weight: 700;
    }
    h2 { margin-top: var(--space-1); overflow-wrap: anywhere; }
    img { width: 96px; height: 96px; border-radius: var(--radius-md); object-fit: cover; }
    .action { grid-column: 1 / -1; display: grid; }
  `
})
export class NextStep {
  readonly status = input.required<string>();
  readonly title = input.required<string>();
  readonly place = input('');
  readonly photo = input<string | null>(null);
}
