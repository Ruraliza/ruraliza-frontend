import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { SystemRole, SystemUser } from '../models/system.model';

// Usuário de sistema (equipe do Ruraliza) que entrou em /sistema/entrar, guardado na aba atual.
// Independente da conta do app: as duas sessões podem coexistir na mesma aba.
export const SYSTEM_SESSION_STORAGE_KEY = 'ruraliza.systemSession';

// O que cada cargo pode fazer no painel (espelha as permissões da API).
// `tracks:manage`: o tutor cria trilhas e edita as dele. `tracks:oversee`: o administrador vê, cria e edita todas.
// `content:manage`: central de ajuda e patrocínios. `moderation:manage`: denúncias e verificação de perfis.
export type SystemPermission =
  | 'users:manage'
  | 'system-users:manage'
  | 'tracks:manage'
  | 'tracks:oversee'
  | 'content:manage'
  | 'moderation:manage';

const PERMISSIONS: Record<SystemRole, readonly SystemPermission[]> = {
  admin: ['users:manage', 'system-users:manage', 'tracks:oversee', 'content:manage', 'moderation:manage'],
  tutor: ['tracks:manage']
};

export const SYSTEM_ROLE_LABEL: Record<SystemRole, string> = { admin: 'Administrador', tutor: 'Tutor' };

interface StoredSystemSession {
  user: SystemUser;
  token: string;
}

@Injectable({ providedIn: 'root' })
export class SystemSessionService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly state = signal<StoredSystemSession | null>(this.restore());

  readonly user = computed(() => this.state()?.user ?? null);
  readonly token = computed(() => this.state()?.token ?? null);

  signIn(user: SystemUser, token: string): void {
    this.save({ user, token });
  }

  // Dados atualizados do mesmo usuário (ex.: GET /auth/system/me): o token continua.
  update(user: SystemUser): void {
    const current = this.state();
    if (current) this.save({ ...current, user });
  }

  clear(): void {
    this.state.set(null);
    if (this.isBrowser) sessionStorage.removeItem(SYSTEM_SESSION_STORAGE_KEY);
  }

  can(permission: SystemPermission): boolean {
    const role = this.user()?.role;
    return role !== undefined && PERMISSIONS[role].includes(permission);
  }

  // Qualquer uma das permissões (ex.: as telas de trilhas, do tutor e do administrador).
  canAny(permissions: readonly SystemPermission[]): boolean {
    return permissions.some((p) => this.can(p));
  }

  private save(session: StoredSystemSession): void {
    this.state.set(session);
    if (this.isBrowser) sessionStorage.setItem(SYSTEM_SESSION_STORAGE_KEY, JSON.stringify(session));
  }

  private restore(): StoredSystemSession | null {
    if (!this.isBrowser) return null;
    const raw = sessionStorage.getItem(SYSTEM_SESSION_STORAGE_KEY);
    if (raw === null) return null;

    try {
      const { user, token } = JSON.parse(raw) as Partial<StoredSystemSession>;
      if (
        typeof token === 'string' &&
        token &&
        user &&
        Number.isInteger(user.id) &&
        typeof user.email === 'string' &&
        typeof user.name === 'string' &&
        (user.role === 'admin' || user.role === 'tutor') &&
        typeof user.insertion_date === 'string'
      ) {
        return { user, token };
      }
    } catch {
      // cai no aviso abaixo
    }
    console.warn(`Valor inválido em sessionStorage["${SYSTEM_SESSION_STORAGE_KEY}"]; a sessão de sistema foi descartada.`);
    sessionStorage.removeItem(SYSTEM_SESSION_STORAGE_KEY);
    return null;
  }
}
