import { Component, input, model } from '@angular/core';

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
}

// Abas internas em pílula. Uso: <app-segmented-control [options]="opts" [(value)]="selected" label="Filtrar serviços" />
@Component({
  selector: 'app-segmented-control',
  template: `
    <div class="track" role="group" [attr.aria-label]="label()">
      @for (option of options(); track option.value) {
        <button
          type="button"
          class="segment"
          [class.active]="option.value === value()"
          [attr.aria-pressed]="option.value === value()"
          (click)="value.set(option.value)"
        >
          {{ option.label }}
        </button>
      }
    </div>
  `,
  styles: `
    :host { display: block; max-width: 100%; overflow-x: auto; }
    .track { display: inline-flex; gap: var(--space-1); padding: var(--space-1); border-radius: var(--radius-pill); background: var(--surface-sunken); }
    .segment {
      min-height: 44px; padding: 0 var(--space-4); border: 0; border-radius: var(--radius-pill);
      background: transparent; color: var(--ink-muted); font-weight: 600; white-space: nowrap;
    }
    .segment:hover { color: var(--ink); }
    .segment.active { background: var(--surface-raised); color: var(--ink); box-shadow: var(--shadow-card); }
  `
})
export class SegmentedControl<T extends string> {
  readonly options = input.required<SegmentOption<T>[]>();
  readonly value = model.required<T>();
  readonly label = input.required<string>();
}
