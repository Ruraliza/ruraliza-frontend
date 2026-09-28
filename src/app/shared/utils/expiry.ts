import { Service } from '../../../models/service.model';

// Validade das vagas (expires_at = último dia, AAAA-MM-DD, no horário de Brasília).
// Mesma regra do backend: vence quando o dia de hoje no Brasil passa do último dia.

const dayFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' });
const shortDate = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' });

export function todayBr(now: Date = new Date()): string {
  return dayFormatter.format(now);
}

export function isExpired(service: Pick<Service, 'status' | 'expires_at'>, now: Date = new Date()): boolean {
  return service.status === 'Pending' && service.expires_at !== null && todayBr(now) > service.expires_at;
}

// Dias até o fim da validade (0 = vence hoje), ou null sem prazo.
export function daysLeft(expiresAt: string | null, now: Date = new Date()): number | null {
  if (expiresAt === null) return null;
  const today = new Date(`${todayBr(now)}T00:00:00Z`).getTime();
  const last = new Date(`${expiresAt}T00:00:00Z`).getTime();
  return Math.round((last - today) / 86_400_000);
}

// "31/10/2026" a partir de "2026-10-31" (sem deslocar o dia pelo fuso).
export function formatDay(day: string): string {
  return shortDate.format(new Date(`${day}T00:00:00Z`));
}

// Texto curto para cards e detalhes.
export function expiryLabel(service: Pick<Service, 'status' | 'expires_at'>, now: Date = new Date()): string | null {
  if (service.expires_at === null || service.status !== 'Pending') return null;
  const left = daysLeft(service.expires_at, now) as number;
  if (left < 0) return 'Prazo encerrado';
  if (left === 0) return 'Último dia para se candidatar';
  if (left === 1) return 'Candidaturas até amanhã';
  return `Candidaturas até ${formatDay(service.expires_at)}`;
}
