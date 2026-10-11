import { Component, input } from '@angular/core';

// Chip de categoria. Em <span> é só rótulo; em <button> vira filtro (aria-pressed).
@Component({
  selector: 'span[appCategoryChip], button[appCategoryChip]',
  host: {
    class: 'chip',
    '[class.chip--selected]': 'selected()',
    '[attr.aria-pressed]': 'interactive() ? selected() : null',
    '[attr.type]': 'interactive() ? "button" : null'
  },
  template: `<ng-content />`,
  styles: `
    :host {
      display: inline-flex; align-items: center; min-height: 32px;
      padding: 4px var(--space-3); border-radius: var(--radius-pill);
      background: var(--broto-soft); color: var(--ink); border: 1px solid transparent;
      font-size: 14px; line-height: 20px; font-weight: 600; white-space: nowrap;
    }
    :host(button) { min-height: 44px; padding-inline: var(--space-4); border-color: var(--line); background: var(--surface-raised); }
    :host(button:hover) { background: var(--surface-sunken); }
    :host(.chip--selected) { background: var(--broto); color: var(--on-broto); border-color: var(--broto); }
    :host(button.chip--selected:hover) { background: var(--broto); }
  `
})
export class CategoryChip {
  readonly selected = input(false);
  readonly interactive = input(false);
}
