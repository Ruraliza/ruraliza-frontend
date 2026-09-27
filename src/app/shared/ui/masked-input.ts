import { Directive, ElementRef, forwardRef, inject, input } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MASKS, Mask, MaskKind } from '../utils/masks';

// Máscara de CPF, telefone ou moeda (BRL) num <input> de formulário reativo.
// O campo mostra o valor formatado; o FormControl guarda o valor limpo
// (dígitos para CPF/telefone, número em reais para moeda).
// Uso: <input appMask="cpf" formControlName="cpf" inputmode="numeric">
@Directive({
  selector: 'input[appMask]',
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => MaskedInput), multi: true }],
  host: {
    '(input)': 'handleInput()',
    '(blur)': 'onTouched()'
  }
})
export class MaskedInput implements ControlValueAccessor {
  readonly appMask = input.required<MaskKind>();

  private readonly element = inject<ElementRef<HTMLInputElement>>(ElementRef).nativeElement;
  private onChange: (value: unknown) => void = () => {};
  protected onTouched: () => void = () => {};

  private get mask(): Mask<unknown> {
    return MASKS[this.appMask()] as Mask<unknown>;
  }

  writeValue(value: unknown): void {
    this.element.value = this.mask.toView(value ?? null);
  }

  registerOnChange(fn: (value: unknown) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.element.disabled = isDisabled;
  }

  protected handleInput(): void {
    const model = this.mask.toModel(this.element.value);
    this.element.value = this.mask.toView(model);
    this.onChange(model);
  }
}
