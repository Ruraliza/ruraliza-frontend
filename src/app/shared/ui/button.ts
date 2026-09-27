import { Component, input } from '@angular/core';

// accent: laranja com texto escuro (CTA secundário). inverse: contornado, sobre foto ou verde.
export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'accent' | 'inverse';

// Uso: <button appButton variant="primary" [loading]="saving()">Publicar serviço</button>
// Também serve para links: <a appButton routerLink="/cadastro">Criar conta</a>
@Component({
  selector: 'button[appButton], a[appButton]',
  host: {
    class: 'btn',
    '[class.btn--primary]': 'variant() === "primary"',
    '[class.btn--secondary]': 'variant() === "secondary"',
    '[class.btn--danger]': 'variant() === "danger"',
    '[class.btn--ghost]': 'variant() === "ghost"',
    '[class.btn--accent]': 'variant() === "accent"',
    '[class.btn--inverse]': 'variant() === "inverse"',
    '[class.btn--block]': 'block()',
    '[class.is-loading]': 'loading()',
    '[attr.aria-busy]': 'loading() || null',
    '[attr.disabled]': 'loading() || disabled() ? "" : null'
  },
  template: `
    @if (loading()) {
      <span class="btn__spinner" aria-hidden="true"></span>
      <span class="visually-hidden">Carregando…</span>
    }
    <ng-content />
  `,
  styles: `
    :host {
      display: inline-flex; align-items: center; justify-content: center; gap: var(--space-2);
      min-height: 48px; padding: 0 var(--space-6);
      border: 1px solid transparent; border-radius: var(--radius-pill);
      font: 600 16px/24px var(--font-sans); text-decoration: none; white-space: nowrap;
      transition: background-color .15s ease, border-color .15s ease;
    }
    :host(.btn--primary) { background: var(--mata); color: var(--on-mata); }
    :host(.btn--primary:hover:not([disabled])) { background: var(--mata-deep); }
    :host(.btn--secondary) { background: var(--surface-raised); color: var(--ink); border-color: var(--line-strong); }
    :host(.btn--secondary:hover:not([disabled])) { background: var(--surface-sunken); }
    :host(.btn--danger) { background: var(--danger); color: var(--surface); }
    :host(.btn--ghost) { background: transparent; color: var(--mata); padding-inline: var(--space-3); }
    :host(.btn--ghost:hover:not([disabled])) { background: var(--surface-sunken); }
    :host(.btn--accent) { background: var(--orange-500); color: var(--ink); }
    :host(.btn--accent:hover:not([disabled])) { box-shadow: inset 0 0 0 999px rgba(255,255,255,.16); }
    :host(.btn--inverse) { background: transparent; color: var(--on-dark); border-color: var(--on-dark-line); }
    :host(.btn--inverse:hover:not([disabled])) { background: rgba(255,255,255,.12); }
    :host(.btn--block) { width: 100%; }
    :host([disabled]) { cursor: not-allowed; opacity: .55; }
    :host(.is-loading) { opacity: .85; cursor: progress; }
    .btn__spinner {
      width: 18px; height: 18px; border-radius: 50%;
      border: 2px solid currentColor; border-right-color: transparent;
      animation: spin .7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `
})
export class Button {
  readonly variant = input<ButtonVariant>('primary');
  readonly loading = input(false);
  readonly disabled = input(false);
  readonly block = input(false);
}
