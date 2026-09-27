import { FormControl } from '@angular/forms';
import { formatCpf, formatPhone, formatHours } from './format';
import { cpfMask, currencyMask, phoneMask } from './masks';
import { positiveNumberValidator } from './validators';

// Intl usa espaço não separável entre "R$" e o número.
const normalizeSpaces = (text: string) => text.replace(/\s/g, ' ');

describe('format', () => {
  it('formats CPF progressively', () => {
    expect(formatCpf('529')).toBe('529');
    expect(formatCpf('5299')).toBe('529.9');
    expect(formatCpf('5299822')).toBe('529.982.2');
    expect(formatCpf('52998224725')).toBe('529.982.247-25');
  });

  it('formats mobile and landline phones', () => {
    expect(formatPhone('24999998888')).toBe('(24) 99999-8888');
    expect(formatPhone('2433334444')).toBe('(24) 3333-4444');
    expect(formatPhone('24')).toBe('(24');
    expect(formatPhone('')).toBe('');
  });

  it('pluralizes hours', () => {
    expect(formatHours(1)).toBe('1 hora');
    expect(formatHours(8)).toBe('8 horas');
  });
});

describe('cpfMask', () => {
  it('keeps only up to 11 digits in the model', () => {
    expect(cpfMask.toModel('529.982.247-25999')).toBe('52998224725');
  });

  it('shows the formatted CPF', () => {
    expect(cpfMask.toView('52998224725')).toBe('529.982.247-25');
  });
});

describe('phoneMask', () => {
  it('keeps digits in the model and formats the view', () => {
    expect(phoneMask.toModel('(24) 99999-8888')).toBe('24999998888');
    expect(phoneMask.toView('24999998888')).toBe('(24) 99999-8888');
  });
});

describe('currencyMask', () => {
  it('reads typed digits as cents (cash register style)', () => {
    expect(currencyMask.toModel('123456')).toBe(1234.56);
    expect(currencyMask.toModel('R$ 1.234,56')).toBe(1234.56);
    expect(currencyMask.toModel('R$ 0,051')).toBe(0.51);
  });

  it('returns null for an empty field', () => {
    expect(currencyMask.toModel('')).toBeNull();
    expect(currencyMask.toModel('R$ ')).toBeNull();
  });

  it('formats the value in BRL', () => {
    expect(normalizeSpaces(currencyMask.toView(1234.5))).toBe('R$ 1.234,50');
    expect(currencyMask.toView(null)).toBe('');
  });
});

describe('positiveNumberValidator', () => {
  it('accepts numbers greater than zero and ignores empty values', () => {
    expect(positiveNumberValidator(new FormControl(8))).toBeNull();
    expect(positiveNumberValidator(new FormControl(null))).toBeNull();
  });

  it('rejects zero and negatives', () => {
    expect(positiveNumberValidator(new FormControl(0))).toEqual({ positive: true });
    expect(positiveNumberValidator(new FormControl(-2))).toEqual({ positive: true });
  });
});
