import { Component } from '@angular/core';
import { Icon } from './icon';

@Component({
  selector: 'app-test-env-banner',
  imports: [Icon],
  host: { role: 'note' },
  template: `<app-icon name="alert" [size]="18" /><span>Ambiente de teste: os dados somem quando o servidor reinicia.</span>`,
  styles: `
    :host {
      display: flex; align-items: center; justify-content: center; gap: var(--space-2);
      padding: var(--space-2) var(--space-4); background: var(--ipe-soft); color: var(--ink);
      font-size: 14px; line-height: 20px; font-weight: 600; text-align: center;
    }
  `
})
export class TestEnvBanner {}
