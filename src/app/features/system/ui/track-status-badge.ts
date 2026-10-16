import { Component, computed, input } from '@angular/core';
import { TrackStatus } from '@core/models/track.model';

export const TRACK_STATUS_LABEL: Record<TrackStatus, string> = {
  draft: 'Rascunho',
  published: 'Publicada',
  discontinued: 'Descontinuada'
};

@Component({
  selector: 'app-track-status-badge',
  template: `{{ label() }}`,
  host: { '[class]': '"badge badge--" + status()' },
  styles: `
    :host {
      display: inline-flex; align-items: center; min-height: 28px; padding: 2px var(--space-3);
      border-radius: var(--radius-pill); font-size: 0.8125rem; line-height: 1.25rem; font-weight: 600; white-space: nowrap;
    }
    :host(.badge--draft) { background: var(--surface-sunken); color: var(--ink-muted); }
    :host(.badge--published) { background: var(--success-soft); color: var(--success); }
    :host(.badge--discontinued) { background: var(--danger-soft); color: var(--danger); }
  `
})
export class TrackStatusBadge {
  readonly status = input.required<TrackStatus>();
  readonly label = computed(() => TRACK_STATUS_LABEL[this.status()]);
}
