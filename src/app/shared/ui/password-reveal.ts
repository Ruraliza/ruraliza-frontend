import { Component, ElementRef, afterRenderEffect, inject, signal } from '@angular/core';

// Botão "Mostrar/Ocultar" ao lado de um campo de senha projetado.
// Uso (dentro de app-form-field): <app-password-reveal><input type="password" formControlName="password"></app-password-reveal>
@Component({
  selector: 'app-password-reveal',
  template: `
    <ng-content />
    <button type="button" class="toggle" [attr.aria-pressed]="visible()" (click)="visible.set(!visible())">
      {{ visible() ? 'Ocultar' : 'Mostrar' }}<span class="visually-hidden"> senha</span>
    </button>
  `,
  styles: `
    :host { display: flex; gap: var(--space-2); align-items: stretch; }
    .toggle {
      flex: none; min-width: 88px; min-height: 48px; padding: 0 var(--space-4);
      border: 1px solid var(--line-strong); border-radius: var(--radius-sm); background: var(--surface-raised);
      color: var(--ink); font-weight: 600; cursor: pointer;
    }
    .toggle:hover { background: var(--surface-sunken); }
    .toggle:focus-visible { box-shadow: var(--focus-ring); outline: none; }
  `
})
export class PasswordReveal {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  readonly visible = signal(false);

  constructor() {
    afterRenderEffect(() => {
      const field = this.host.nativeElement.querySelector('input');
      if (!field) throw new Error('app-password-reveal precisa de um <input> projetado.');
      field.type = this.visible() ? 'text' : 'password';
    });
  }
}
