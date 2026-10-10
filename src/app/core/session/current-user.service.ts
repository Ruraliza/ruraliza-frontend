import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { SessionUser, UserRole } from '../../../models/auth.model';

export type { UserRole };

// Quem entrou com e-mail e senha, guardado na aba atual.
// A API ainda não emite token de sessão: isto só lembra o perfil depois do login.
export type CurrentUser = SessionUser;

export const CURRENT_USER_STORAGE_KEY = 'ruraliza.currentUser';

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
      if ((parsed.role === 'farmer' || parsed.role === 'worker') && Number.isInteger(parsed.id)) {
        return { role: parsed.role, id: parsed.id as number };
      }
    } catch {
      // cai no aviso abaixo
    }
    console.warn(`Valor inválido em sessionStorage["${CURRENT_USER_STORAGE_KEY}"]; o perfil foi descartado.`);
    sessionStorage.removeItem(CURRENT_USER_STORAGE_KEY);
    return null;
  }
}
