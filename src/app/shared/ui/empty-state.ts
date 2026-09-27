import { Component, input } from '@angular/core';
import { Icon, IconName } from './icon';

// Estado vazio que convida à próxima ação (botões entram por projeção).
@Component({
  selector: 'app-empty-state',
  imports: [Icon],
  template: `
    <span class="icon"><app-icon [name]="icon()" [size]="28" /></span>
    <h2 class="t-h3">{{ title() }}</h2>
    <p class="muted">{{ message() }}</p>
    <div class="actions"><ng-content /></div>
  `,
  styles: `
    :host {
      display: grid; justify-items: center; gap: var(--space-3); text-align: center;
      padding: var(--space-12) var(--space-6); border-radius: var(--radius-lg);
      border: 1px dashed var(--line-strong); background: var(--surface-raised);
    }
    .icon { display: grid; place-items: center; width: 56px; height: 56px; border-radius: 50%; background: var(--broto-soft); color: var(--ink); }
    p { max-width: 44ch; }
    .actions { display: flex; flex-wrap: wrap; justify-content: center; gap: var(--space-3); padding-top: var(--space-2); }
    .actions:empty { display: none; }
  `
})
export class EmptyState {
  readonly title = input.required<string>();
  readonly message = input.required<string>();
  readonly icon = input<IconName>('sprout');
}
