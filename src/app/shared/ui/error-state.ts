import { Component, input, output } from '@angular/core';
import { Button } from './button';
import { Icon } from './icon';

// Erro de carregamento (GET). Sempre oferece "Tentar de novo".
@Component({
  selector: 'app-error-state',
  imports: [Button, Icon],
  template: `
    <span class="icon"><app-icon name="alert" [size]="28" /></span>
    <h2 class="t-h3">{{ title() }}</h2>
    <p>{{ message() }}</p>
    <button appButton variant="secondary" type="button" (click)="retry.emit()">Tentar de novo</button>
  `,
  host: { role: 'alert' },
  styles: `
    :host {
      display: grid; justify-items: center; gap: var(--space-3); text-align: center;
      padding: var(--space-12) var(--space-6); border-radius: var(--radius-lg);
      background: var(--danger-soft); color: var(--ink);
    }
    .icon { color: var(--danger); }
    p { max-width: 52ch; }
  `
})
export class ErrorState {
  readonly message = input.required<string>();
  readonly title = input('Não foi possível carregar');
  readonly retry = output<void>();
}
