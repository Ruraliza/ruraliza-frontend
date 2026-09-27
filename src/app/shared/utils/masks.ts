import { formatBRL, formatCpf, formatPhone, onlyDigits } from './format';

// Cada máscara converte entre o texto exibido no campo e o valor do modelo.
export interface Mask<T> {
  toModel(text: string): T;
  toView(value: T): string;
}

// Modelo: só os dígitos ("12345678909").
export const cpfMask: Mask<string> = {
  toModel: (text) => onlyDigits(text).slice(0, 11),
  toView: (value) => formatCpf(value ?? '')
};

// Modelo: só os dígitos com DDD ("24999998888").
export const phoneMask: Mask<string> = {
  toModel: (text) => onlyDigits(text).slice(0, 11),
  toView: (value) => formatPhone(value ?? '')
};

// Modelo: número em reais (1234.5) ou null. Digitar funciona como caixa registradora:
// "123450" vira R$ 1.234,50.
export const currencyMask: Mask<number | null> = {
  toModel: (text) => {
    const digits = onlyDigits(text).replace(/^0+/, '').slice(0, 11);
    return digits === '' ? null : Number(digits) / 100;
  },
  toView: (value) => (value === null || value === undefined ? '' : formatBRL(value))
};

export const MASKS = { cpf: cpfMask, phone: phoneMask, currency: currencyMask } as const;
export type MaskKind = keyof typeof MASKS;
