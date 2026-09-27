import { Component, ElementRef, afterRenderEffect, computed, effect, inject, input, signal } from '@angular/core';
import { AbstractControl } from '@angular/forms';

// Mensagens padrão por tipo de erro de validação.
const DEFAULT_MESSAGES: Record<string, string> = {
  required: 'Preencha este campo.',
  email: 'Digite um e-mail válido, como nome@exemplo.com.',
  cpf: 'CPF inválido. Confira os 11 dígitos.',
  min: 'O valor precisa ser maior que zero.',
  positive: 'Digite um número maior que zero.',
  minlength: 'Texto muito curto.',
  phone: 'Digite o telefone com DDD.'
};

// Rótulo sempre visível acima do campo, dica e erro ligados via aria-describedby.
// O controle projetado (input/select/textarea) recebe id, aria-describedby e aria-invalid.
@Component({
  selector: 'app-form-field',
  template: `
    <label class="t-label" [for]="fieldId()">
      {{ label() }}
      @if (optional()) { <span class="muted">(opcional)</span> }
    </label>
    <ng-content />
    @if (hint()) {
      <p class="t-body-sm muted" [id]="fieldId() + '-hint'">{{ hint() }}</p>
    }
    @if (errorMessage(); as message) {
      <p class="field-error t-body-sm" [id]="fieldId() + '-error'">{{ message }}</p>
    }
  `,
  styles: `
    :host { display: grid; gap: var(--space-2); }
    .field-error { color: var(--danger); font-weight: 600; }
  `
})
export class FormField {
  readonly label = input.required<string>();
  readonly fieldId = input.required<string>();
  readonly control = input.required<AbstractControl>();
  readonly hint = input<string>('');
  readonly optional = input(false);
  readonly messages = input<Record<string, string>>({});

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  // Os estados do controle não são signals; este contador muda a cada evento do controle.
  private readonly controlVersion = signal(0);

  readonly errorMessage = computed(() => {
    this.controlVersion();
    const control = this.control();
    if (!control.errors || !control.touched) return null;
    const key = Object.keys(control.errors)[0];
    return this.messages()[key] ?? DEFAULT_MESSAGES[key] ?? 'Confira este campo.';
  });

  constructor() {
    effect((onCleanup) => {
      const subscription = this.control().events.subscribe(() => this.controlVersion.update((v) => v + 1));
      onCleanup(() => subscription.unsubscribe());
    });

    afterRenderEffect(() => {
      const element = this.host.nativeElement.querySelector('input, select, textarea');
      if (!element) {
        throw new Error(`app-form-field "${this.fieldId()}" precisa de um input, select ou textarea projetado.`);
      }
      const describedBy = [this.hint() ? `${this.fieldId()}-hint` : '', this.errorMessage() ? `${this.fieldId()}-error` : '']
        .filter(Boolean)
        .join(' ');
      element.id = this.fieldId();
      toggleAttribute(element, 'aria-describedby', describedBy);
      toggleAttribute(element, 'aria-invalid', this.errorMessage() ? 'true' : '');
    });
  }
}

function toggleAttribute(element: Element, name: string, value: string): void {
  if (value) element.setAttribute(name, value);
  else element.removeAttribute(name);
}
