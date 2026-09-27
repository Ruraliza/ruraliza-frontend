import { FormControl } from '@angular/forms';
import { cpfValidator, isValidCpf } from './cpf';

describe('isValidCpf', () => {
  it('accepts CPFs with valid check digits', () => {
    expect(isValidCpf('52998224725')).toBe(true);
    expect(isValidCpf('11144477735')).toBe(true);
    expect(isValidCpf('12345678909')).toBe(true);
  });

  it('rejects wrong check digits', () => {
    expect(isValidCpf('52998224726')).toBe(false);
    expect(isValidCpf('12345678900')).toBe(false);
  });

  it('rejects repeated digits, wrong length and formatting', () => {
    expect(isValidCpf('11111111111')).toBe(false);
    expect(isValidCpf('5299822472')).toBe(false);
    expect(isValidCpf('529.982.247-25')).toBe(false);
    expect(isValidCpf('')).toBe(false);
  });
});

describe('cpfValidator', () => {
  it('leaves empty values to Validators.required', () => {
    expect(cpfValidator(new FormControl(''))).toBeNull();
  });

  it('flags an invalid CPF', () => {
    expect(cpfValidator(new FormControl('12345678900'))).toEqual({ cpf: true });
  });

  it('accepts a valid CPF', () => {
    expect(cpfValidator(new FormControl('52998224725'))).toBeNull();
  });
});
