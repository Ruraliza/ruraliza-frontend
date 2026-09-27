import { Component, inject } from '@angular/core';
import { ToastService } from '../../core/toast/toast.service';
import { Icon } from './icon';

// Pilha de toasts (uma instância, no App). Erros em região "assertive", demais em "polite".
@Component({
  selector: 'app-toast-container',
  imports: [Icon],
  template: `
    <div class="stack" role="status" aria-live="polite">
      @for (toast of toasts(); track toast.id) {
        @if (toast.kind !== 'error') {
          <div [class]="'toast toast--' + toast.kind">
            <app-icon [name]="toast.kind === 'success' ? 'check' : 'alert'" [size]="20" />
            <p>{{ toast.message }}</p>
            <button type="button" class="close" (click)="dismiss(toast.id)"><app-icon name="x" [size]="18" label="Fechar aviso" /></button>
          </div>
        }
      }
    </div>
    <div class="stack" role="alert" aria-live="assertive">
      @for (toast of toasts(); track toast.id) {
        @if (toast.kind === 'error') {
          <div class="toast toast--error">
            <app-icon name="alert" [size]="20" />
            <p>{{ toast.message }}</p>
            <button type="button" class="close" (click)="dismiss(toast.id)"><app-icon name="x" [size]="18" label="Fechar aviso" /></button>
          </div>
        }
      }
    </div>
  `,
  styles: `
    :host {
      position: fixed; z-index: 50; left: var(--space-4); right: var(--space-4);
      bottom: calc(var(--bottom-nav-height) + env(safe-area-inset-bottom) + var(--space-4));
      display: grid; gap: var(--space-2); pointer-events: none;
    }
    @media (min-width: 1024px) { :host { left: auto; right: var(--space-6); bottom: var(--space-6); width: 400px; } }
    .stack { display: grid; gap: var(--space-2); }
    .toast {
      pointer-events: auto; display: flex; align-items: flex-start; gap: var(--space-3);
      padding: var(--space-3) var(--space-3) var(--space-3) var(--space-4);
      border-radius: var(--radius-md); box-shadow: var(--shadow-float);
      background: var(--surface-raised); color: var(--ink); border: 1px solid var(--line);
    }
    .toast p { flex: 1; padding-top: 2px; }
    .toast--success { background: var(--success-soft); color: var(--success); border-color: transparent; }
    .toast--error { background: var(--danger-soft); color: var(--danger); border-color: transparent; }
    .toast--success p, .toast--error p { color: var(--ink); }
    .close { display: grid; place-items: center; width: 36px; height: 36px; border: 0; border-radius: 50%; background: transparent; color: var(--ink-muted); }
    .close:hover { background: var(--surface-sunken); }
  `
})
export class ToastContainer {
  private readonly toastService = inject(ToastService);
  readonly toasts = this.toastService.toasts;

  dismiss(id: number): void {
    this.toastService.dismiss(id);
  }
}
