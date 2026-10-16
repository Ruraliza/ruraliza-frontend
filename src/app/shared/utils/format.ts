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

// Celular brasileiro com DDD (11 dígitos, o terceiro é 9): o único tipo de número com WhatsApp.
export function isMobilePhone(digits: string): boolean {
  return /^[1-9]{2}9\d{8}$/.test(onlyDigits(digits));
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

const longDate = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/Sao_Paulo' });

// "11 de outubro de 2026" (horário de Brasília), como nos certificados.
export function formatLongDate(isoDate: string): string {
  return longDate.format(new Date(isoDate));
}

// Carga horária: 45 -> "45 min"; 60 -> "1 h"; 105 -> "1 h 45 min".
export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

// Carga horária por extenso, como nos certificados: 60 -> "1 hora"; 105 -> "1 hora e 45 minutos".
export function formatWorkload(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const hours = h === 1 ? '1 hora' : `${h} horas`;
  const mins = m === 1 ? '1 minuto' : `${m} minutos`;
  if (h === 0) return mins;
  return m === 0 ? hours : `${hours} e ${mins}`;
}
