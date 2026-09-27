import { Component, computed, input } from '@angular/core';
import { StatusKey, statusMeta } from '../../../models/status';
import { Icon } from './icon';

// Único componente de status: rótulo, cor e ícone vêm do mapa em models/status.ts.
@Component({
  selector: 'app-status-badge',
  imports: [Icon],
  host: { '[class]': '"badge badge--" + meta().tone' },
  template: `<app-icon [name]="meta().icon" [size]="16" />{{ meta().label }}`,
  styles: `
    :host {
      display: inline-flex; align-items: center; gap: var(--space-1);
      padding: 2px var(--space-3) 2px var(--space-2); border-radius: var(--radius-pill);
      font-size: 14px; line-height: 20px; font-weight: 600; white-space: nowrap;
    }
    :host(.badge--pending) { background: var(--ipe-soft); color: var(--ink); }
    :host(.badge--progress) { background: var(--info-soft); color: var(--info); }
    :host(.badge--success) { background: var(--success-soft); color: var(--success); }
    :host(.badge--danger) { background: var(--danger-soft); color: var(--danger); }
    :host(.badge--neutral) { background: var(--surface-sunken); color: var(--ink-muted); }
  `
})
export class StatusBadge {
  readonly status = input.required<StatusKey>();
  readonly meta = computed(() => statusMeta(this.status()));
}
