import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

// Sem autenticação: é só a seleção de um perfil de teste, guardada na aba atual.
export type UserRole = 'farmer' | 'worker';

export interface CurrentUser {
  role: UserRole;
  id: number;
}

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
      throw new Error(`Nenhum perfil de teste do tipo "${role}" selecionado.`);
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
