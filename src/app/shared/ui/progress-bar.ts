import { Component, input } from '@angular/core';

// Barra de progresso (0 a 100) com o rótulo lido pelo leitor de tela.
@Component({
  selector: 'app-progress-bar',
  host: {
    role: 'progressbar',
    'aria-valuemin': '0',
    'aria-valuemax': '100',
    '[attr.aria-valuenow]': 'value()',
    '[attr.aria-label]': 'label()'
  },
  template: `<span class="fill" [style.width.%]="value()"></span>`,
  styles: `
    :host { display: block; height: 8px; border-radius: var(--radius-pill); background: var(--surface-sunken); overflow: hidden; }
    .fill { display: block; height: 100%; border-radius: inherit; background: var(--broto); transition: width .3s var(--ease-out); }
  `
})
export class ProgressBar {
  readonly value = input.required<number>();
  readonly label = input('Progresso');
}
