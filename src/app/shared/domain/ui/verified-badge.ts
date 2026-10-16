import { Component, input } from '@angular/core';
import { Icon } from '../../ui/icon';

// Selo de identidade conferida pela equipe (verificação por documento). Azul, para não se confundir
// com o verde das ações nem com o laranja das notas.
@Component({
  selector: 'app-verified-badge',
  imports: [Icon],
  host: { title: 'A equipe do Ruraliza conferiu o documento desta pessoa' },
  template: `<app-icon name="shield-check" [size]="16" />{{ label() }}`,
  styles: `
    :host {
      display: inline-flex; align-items: center; gap: var(--space-1); padding: 2px var(--space-2) 2px 6px;
      border-radius: var(--radius-pill); background: var(--info-soft); color: var(--info);
      font-size: 0.8125rem; line-height: 1.25rem; font-weight: 700; white-space: nowrap;
    }
  `
})
export class VerifiedBadge {
  readonly label = input('Verificado');
}
