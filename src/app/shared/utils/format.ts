// Formatação para exibição (pt-BR).

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const date = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });

export function onlyDigits(value: string): string {
  return value.replace(/\D/g, '');
}

// 12345678909 -> 123.456.789-09 (formata parcialmente enquanto digita)
export function formatCpf(digits: string): string {
  const d = onlyDigits(digits).slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

// 24999998888 -> (24) 99999-8888 ; 2433334444 -> (24) 3333-4444
export function formatPhone(digits: string): string {
  const d = onlyDigits(digits).slice(0, 11);
  if (d.length === 0) return '';
  if (d.length <= 2) return `(${d}`;
  const area = d.slice(0, 2);
  const rest = d.slice(2);
  const split = d.length === 11 ? 5 : 4;
  if (rest.length <= split) return `(${area}) ${rest}`;
  return `(${area}) ${rest.slice(0, split)}-${rest.slice(split)}`;
}

export function formatBRL(value: number): string {
  return brl.format(value);
}

export function formatDate(isoDate: string): string {
  return date.format(new Date(isoDate));
}

export function formatHours(hours: number): string {
  return hours === 1 ? '1 hora' : `${hours} horas`;
}
