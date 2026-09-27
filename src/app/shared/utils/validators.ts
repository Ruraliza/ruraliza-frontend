import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

// Número estritamente maior que zero. Campo vazio fica por conta do Validators.required.
export const positiveNumberValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const value = control.value;
  if (value === null || value === undefined || value === '') return null;
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? null : { positive: true };
};
