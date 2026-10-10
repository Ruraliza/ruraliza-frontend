import { Location } from '@angular/common';
import { UserRole } from '../../../models/auth.model';

// Dados levados entre as telas de acesso (entrar → esqueci a senha → nova senha → entrar) pelo
// `state` da navegação, e não pela URL: o token de redefinição não fica no histórico nem em logs.
// Recarregar a página mantém o state (fica no history do navegador); abrir o endereço direto, não.
export interface AuthPrefill {
  role: UserRole;
  email: string;
}

export interface ResetState extends AuthPrefill {
  token: string;
}

function isRole(value: unknown): value is UserRole {
  return value === 'farmer' || value === 'worker';
}

function readState(location: Location): Record<string, unknown> | null {
  const state: unknown = location.getState();
  return typeof state === 'object' && state !== null ? (state as Record<string, unknown>) : null;
}

export function readAuthPrefill(location: Location): AuthPrefill | null {
  const state = readState(location);
  if (!state || !isRole(state['role']) || typeof state['email'] !== 'string') return null;
  return { role: state['role'], email: state['email'] };
}

export function readResetState(location: Location): ResetState | null {
  const prefill = readAuthPrefill(location);
  const token = readState(location)?.['token'];
  return prefill && typeof token === 'string' && token ? { ...prefill, token } : null;
}
