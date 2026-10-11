import { UserRole } from '@core/models/auth.model';

// Regras de tela da conversa: horários, dias, atalhos de resposta e o aviso de número oculto.

const TIME_ZONE = 'America/Sao_Paulo';
const timeFormat = new Intl.DateTimeFormat('pt-BR', { timeZone: TIME_ZONE, hour: '2-digit', minute: '2-digit' });
const dayKeyFormat = new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' });
const shortDate = new Intl.DateTimeFormat('pt-BR', { timeZone: TIME_ZONE, day: '2-digit', month: '2-digit' });
const longDate = new Intl.DateTimeFormat('pt-BR', { timeZone: TIME_ZONE, weekday: 'long', day: 'numeric', month: 'long' });

const DAY_MS = 24 * 60 * 60 * 1000;

// Dia (AAAA-MM-DD) no horário de Brasília.
export function dayKey(iso: string): string {
  return dayKeyFormat.format(new Date(iso));
}

// Na lista: "14:32" hoje, "Ontem", ou "12/10".
export function chatTime(iso: string, now = new Date()): string {
  const day = dayKey(iso);
  if (day === dayKey(now.toISOString())) return timeFormat.format(new Date(iso));
  if (day === dayKey(new Date(now.getTime() - DAY_MS).toISOString())) return 'Ontem';
  return shortDate.format(new Date(iso));
}

// Na conversa: hora de cada mensagem.
export function messageTime(iso: string): string {
  return timeFormat.format(new Date(iso));
}

// Separador de dia: "Hoje", "Ontem" ou "segunda-feira, 12 de outubro".
export function dayLabel(iso: string, now = new Date()): string {
  const day = dayKey(iso);
  if (day === dayKey(now.toISOString())) return 'Hoje';
  if (day === dayKey(new Date(now.getTime() - DAY_MS).toISOString())) return 'Ontem';
  return longDate.format(new Date(iso));
}

// Atalhos para quem está no campo, com o celular numa mão: preenchem a mensagem (dá para editar).
export const QUICK_REPLIES: Readonly<Record<UserRole, readonly string[]>> = {
  worker: ['Estou a caminho.', 'Cheguei na fazenda.', 'Que horas começo?', 'Preciso levar alguma ferramenta?'],
  farmer: ['Pode começar às 7h?', 'A fazenda fornece o almoço.', 'Traga luvas e chapéu.', 'Me avise quando chegar.']
};

// Mesma regra da API: 8 a 13 dígitos seguidos (com espaço, ponto, traço, parênteses ou +), ou um e-mail.
const PHONE_LIKE = /\+?\(?\d[\d\s().-]{6,}\d/g;
const EMAIL_LIKE = /[^\s@]+@[^\s@]+\.[^\s@]+/;

// O texto tem telefone ou e-mail (que a API vai ocultar enquanto os dois não liberarem o WhatsApp).
export function hasContact(text: string): boolean {
  if (EMAIL_LIKE.test(text)) return true;
  return (text.match(PHONE_LIKE) ?? []).some((match) => {
    const digits = match.replace(/\D/g, '').length;
    return digits >= 8 && digits <= 13;
  });
}

// Link do WhatsApp para um telefone brasileiro guardado só com dígitos (DDD + número).
export function whatsappLink(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return `https://wa.me/${digits.startsWith('55') ? digits : `55${digits}`}`;
}
