import { Location } from '@angular/common';

// Dados levados entre as telas de acesso (entrar → esqueci a senha → nova senha → entrar) pelo
// `state` da navegação, e não pela URL: o token de redefinição não fica no histórico nem em logs.
// Recarregar a página mantém o state (fica no history do navegador); abrir o endereço direto, não.
export interface AuthPrefill {
  email: string;
}

export interface ResetState extends AuthPrefill {
  token: string;
}

function readState(location: Location): Record<string, unknown> | null {
  const state: unknown = location.getState();
  return typeof state === 'object' && state !== null ? (state as Record<string, unknown>) : null;
}

export function readAuthPrefill(location: Location): AuthPrefill | null {
  const state = readState(location);
  if (!state || typeof state['email'] !== 'string') return null;
  return { email: state['email'] };
}

export function readResetState(location: Location): ResetState | null {
  const prefill = readAuthPrefill(location);
  const token = readState(location)?.['token'];
  return prefill && typeof token === 'string' && token ? { ...prefill, token } : null;
}
