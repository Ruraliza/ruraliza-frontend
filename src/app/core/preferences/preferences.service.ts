import { DOCUMENT, Injectable, PLATFORM_ID, computed, effect, inject, signal, untracked } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { AccountPreferences, AccountPreferencesInput } from '../models/auth.model';
import { AccountService } from '../api/account.service';
import { CurrentUserService } from '../session/current-user.service';

// Mesma chave lida pelo script de index.html, que aplica o tema antes do app carregar (sem piscar).
export const PREFERENCES_STORAGE_KEY = 'ruraliza.preferences';

// Tema claro por padrão: o app é usado ao ar livre, sob o sol, onde o fundo claro se lê melhor.
export const DEFAULT_PREFERENCES: AccountPreferences = { theme: 'light', text_size: 'normal', high_contrast: false };

export type ResolvedTheme = 'light' | 'dark';

function isPreferences(value: unknown): value is AccountPreferences {
  if (typeof value !== 'object' || value === null) return false;
  const { theme, text_size, high_contrast } = value as Partial<AccountPreferences>;
  return (theme === 'light' || theme === 'dark' || theme === 'system')
    && (text_size === 'normal' || text_size === 'large')
    && typeof high_contrast === 'boolean';
}

// Tema (claro, escuro ou do aparelho), letras maiores e alto contraste.
// Vale na hora neste aparelho (localStorage) e, com a conta aberta, fica salvo nela: quem entra em
// outro aparelho encontra o app do mesmo jeito. Aplica no <html>: data-theme, data-text e data-contrast
// (as cores e o tamanho do texto estão em styles/tokens.css).
@Injectable({ providedIn: 'root' })
export class PreferencesService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly document = inject(DOCUMENT);
  private readonly accounts = inject(AccountService);
  private readonly currentUser = inject(CurrentUserService);

  private readonly state = signal<AccountPreferences>(this.restore());
  private readonly systemDark = signal(false);
  private readonly accountId = computed(() => this.currentUser.user()?.account_id ?? null);

  readonly preferences = this.state.asReadonly();
  readonly theme = computed<ResolvedTheme>(() => {
    const theme = this.state().theme;
    return theme === 'system' ? (this.systemDark() ? 'dark' : 'light') : theme;
  });
  // Atalho do menu: letras maiores e alto contraste juntos.
  readonly easyReading = computed(() => this.state().text_size === 'large' && this.state().high_contrast);

  constructor() {
    if (!this.isBrowser) return;

    // Sem matchMedia (navegador muito antigo, testes), 'system' fica no claro.
    if (typeof matchMedia === 'function') {
      const media = matchMedia('(prefers-color-scheme: dark)');
      this.systemDark.set(media.matches);
      media.addEventListener('change', (event) => this.systemDark.set(event.matches));
    }

    effect(() => this.apply(this.state(), this.theme()));

    // Conta aberta: valem as preferências salvas nela (seguem a pessoa entre aparelhos).
    effect(() => {
      const accountId = this.accountId();
      if (accountId !== null) untracked(() => this.loadFrom(accountId));
    });
  }

  update(changes: AccountPreferencesInput): void {
    this.state.update((current) => ({ ...current, ...changes }));
    this.store();
    const accountId = this.accountId();
    // Sem conexão, a preferência continua valendo neste aparelho; a conta recebe na próxima mudança.
    if (accountId !== null) this.accounts.updatePreferences(accountId, changes).subscribe({ error: () => undefined });
  }

  toggleEasyReading(): void {
    const on = !this.easyReading();
    this.update({ text_size: on ? 'large' : 'normal', high_contrast: on });
  }

  private loadFrom(accountId: number): void {
    this.accounts.getPreferences(accountId).subscribe({
      next: (preferences) => {
        if (this.accountId() !== accountId) return; // trocou de conta no meio do caminho
        this.state.set(preferences);
        this.store();
      },
      error: () => undefined // sem conexão: fica o que está salvo neste aparelho
    });
  }

  private apply(preferences: AccountPreferences, theme: ResolvedTheme): void {
    const root = this.document.documentElement;
    root.dataset['theme'] = theme;
    toggleData(root, 'text', preferences.text_size === 'large' ? 'large' : null);
    toggleData(root, 'contrast', preferences.high_contrast ? 'high' : null);
  }

  private store(): void {
    try {
      localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(this.state()));
    } catch {
      // armazenamento cheio ou bloqueado (aba anônima): vale só enquanto a página estiver aberta
    }
  }

  private restore(): AccountPreferences {
    if (!this.isBrowser) return DEFAULT_PREFERENCES;
    try {
      const saved: unknown = JSON.parse(localStorage.getItem(PREFERENCES_STORAGE_KEY) ?? 'null');
      return isPreferences(saved) ? saved : DEFAULT_PREFERENCES;
    } catch {
      return DEFAULT_PREFERENCES;
    }
  }
}

function toggleData(element: HTMLElement, key: string, value: string | null): void {
  if (value === null) delete element.dataset[key];
  else element.dataset[key] = value;
}
