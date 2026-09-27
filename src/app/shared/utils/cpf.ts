import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

// Mesmo algoritmo do backend: 11 dígitos, não repetidos, dígitos verificadores válidos.
export function isValidCpf(cpf: string): boolean {
  if (!/^\d{11}$/.test(cpf)) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false;

  const digits = cpf.split('').map(Number);
  const checkDigit = (length: number): number => {
    let sum = 0;
    for (let i = 0; i < length; i++) sum += digits[i] * (length + 1 - i);
    const rest = (sum * 10) % 11;
    return rest === 10 ? 0 : rest;
  };

  return checkDigit(9) === digits[9] && checkDigit(10) === digits[10];
}

// Validador para um controle cujo valor são só os dígitos do CPF.
// Campo vazio fica por conta do Validators.required.
export const cpfValidator: ValidatorFn = (control: AbstractControl<string>): ValidationErrors | null => {
  const value = control.value ?? '';
  if (value === '') return null;
  return isValidCpf(value) ? null : { cpf: true };
};
