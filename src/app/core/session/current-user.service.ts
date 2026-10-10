import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { SessionUser, UserRole } from '../../../models/auth.model';

export type { UserRole };

// Quem entrou com e-mail e senha, guardado na aba atual.
// A API ainda não emite token de sessão: isto só lembra a conta depois do login.
// `role`/`id` são o painel aberto; `profiles` diz quais perfis a conta tem.
export type CurrentUser = SessionUser;

export const CURRENT_USER_STORAGE_KEY = 'ruraliza.currentUser';

function isProfileId(value: unknown): value is number | null {
  return value === null || Number.isInteger(value);
}

@Injectable({ providedIn: 'root' })
export class CurrentUserService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly state = signal<CurrentUser | null>(this.restore());

  readonly user = this.state.asReadonly();
  readonly role = computed(() => this.state()?.role ?? null);

  set(user: CurrentUser): void {
    this.state.set(user);
    if (this.isBrowser) {
      sessionStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(user));
    }
  }

  clear(): void {
    this.state.set(null);
    if (this.isBrowser) {
      sessionStorage.removeItem(CURRENT_USER_STORAGE_KEY);
    }
  }

  hasProfile(role: UserRole): boolean {
    return (this.state()?.profiles[role] ?? null) !== null;
  }

  // Abre o painel de outro perfil que a conta já tem, só nesta aba (sem avisar a API).
  activate(role: UserRole): void {
    const user = this.state();
    const id = user?.profiles[role] ?? null;
    if (!user || id === null) {
      throw new Error(`A conta não tem perfil do tipo "${role}".`);
    }
    this.set({ ...user, role, id });
  }

  // Id do usuário atual para o papel esperado. Falha rápido se a tela
  // foi aberta sem o perfil certo (o guard deveria ter impedido).
  requireId(role: UserRole): number {
    const user = this.state();
    if (!user || user.role !== role) {
      throw new Error(`Nenhum perfil do tipo "${role}" entrou.`);
    }
    return user.id;
  }

  private restore(): CurrentUser | null {
    if (!this.isBrowser) return null;

    const raw = sessionStorage.getItem(CURRENT_USER_STORAGE_KEY);
    if (raw === null) return null;

    try {
      const parsed = JSON.parse(raw) as Partial<CurrentUser>;
      const { account_id, role, id, profiles } = parsed;
      if (
        Number.isInteger(account_id) &&
        (role === 'farmer' || role === 'worker') &&
        Number.isInteger(id) &&
        profiles &&
        isProfileId(profiles.farmer) &&
        isProfileId(profiles.worker) &&
        profiles[role] === id
      ) {
        return { account_id: account_id as number, role, id: id as number, profiles: { farmer: profiles.farmer, worker: profiles.worker } };
      }
    } catch {
      // cai no aviso abaixo
    }
    console.warn(`Valor inválido em sessionStorage["${CURRENT_USER_STORAGE_KEY}"]; o perfil foi descartado.`);
    sessionStorage.removeItem(CURRENT_USER_STORAGE_KEY);
    return null;
  }
}
