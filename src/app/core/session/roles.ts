import { UserRole } from '../../../models/auth.model';

// Os dois painéis da conta: endereço, nome e trecho da URL de cada perfil.
export const ROLE_HOME: Record<UserRole, string> = { farmer: '/produtor', worker: '/trabalhador' };
export const ROLE_LABEL: Record<UserRole, string> = { farmer: 'produtor', worker: 'trabalhador' };
export const ROLE_SLUG: Record<UserRole, string> = { farmer: 'produtor', worker: 'trabalhador' };

export function otherRole(role: UserRole): UserRole {
  return role === 'farmer' ? 'worker' : 'farmer';
}

export function roleFromSlug(slug: string | undefined): UserRole | null {
  if (slug === ROLE_SLUG.farmer) return 'farmer';
  if (slug === ROLE_SLUG.worker) return 'worker';
  return null;
}

// Página que cria o outro perfil na mesma conta.
export function newProfileUrl(role: UserRole): string {
  return `/conta/novo-perfil/${ROLE_SLUG[role]}`;
}
