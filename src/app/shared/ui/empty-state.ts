import { Component, input } from '@angular/core';
import { Icon, IconName } from './icon';

// Estado vazio que convida à próxima ação (botões entram por projeção).
// art: troca o ícone pela ilustração da sede da fazenda (listas vazias das áreas principais).
@Component({
  selector: 'app-empty-state',
  imports: [Icon],
  host: { '[class.art]': 'art()' },
  template: `
    @if (art()) {
      <img class="illustration" src="assets/images/ilustracao-sede.webp" alt="" width="240" height="165" />
    } @else {
      <span class="icon"><app-icon [name]="icon()" [size]="28" /></span>
    }
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
    :host(.art) { border: 0; background: transparent; padding-block: var(--space-6); }
    .illustration { width: min(240px, 70%); height: auto; margin-bottom: var(--space-2); }
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
  readonly art = input(false);
}
