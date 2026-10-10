import { AbstractControl, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

// Senha: de 8 a 128 caracteres (mesmos limites do servidor). Espaços contam: não use trim.
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

export const passwordValidators = [Validators.required, Validators.minLength(PASSWORD_MIN_LENGTH), Validators.maxLength(PASSWORD_MAX_LENGTH)];

export const PASSWORD_HINT = `Pelo menos ${PASSWORD_MIN_LENGTH} caracteres.`;

export const PASSWORD_MESSAGES = {
  minlength: `A senha precisa ter pelo menos ${PASSWORD_MIN_LENGTH} caracteres.`,
  maxlength: `A senha pode ter no máximo ${PASSWORD_MAX_LENGTH} caracteres.`
};

export const CONFIRMATION_MESSAGES = {
  required: 'Digite a senha de novo para confirmar.',
  mismatch: 'As senhas não são iguais. Confira e digite de novo.'
};

// Confirmação: precisa ser igual ao controle `field` do mesmo grupo.
export function matchesField(field: string): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const other = control.parent?.get(field);
    if (!other || !control.value) return null;
    return control.value === other.value ? null : { mismatch: true };
  };
}

// O validador da confirmação só roda quando ela muda; isto o roda de novo quando a senha muda.
// Chame num contexto de injeção (construtor ou inicializador de campo do componente).
export function revalidateWith(source: AbstractControl, target: AbstractControl): void {
  source.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => target.updateValueAndValidity());
}
