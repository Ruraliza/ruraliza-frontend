import { Component, computed, inject } from '@angular/core';
import { ThemePreference } from '../models/auth.model';
import { PreferencesService } from '../preferences/preferences.service';
import { CurrentUserService } from '../session/current-user.service';
import { SegmentOption, SegmentedControl } from '@shared/ui/segmented-control';
import { SwitchField } from '@shared/ui/switch-field';

const THEMES: SegmentOption<ThemePreference>[] = [
  { value: 'light', label: 'Claro' },
  { value: 'dark', label: 'Escuro' },
  { value: 'system', label: 'Automático' }
];

// Cartão "Aparência e leitura" das páginas de perfil: tema, letras maiores e alto contraste.
// Com a conta aberta, fica salvo nela; na área da equipe (sem conta do app), vale neste aparelho.
@Component({
  selector: 'app-display-preferences',
  imports: [SegmentedControl, SwitchField],
  template: `
    <section class="card stack" aria-labelledby="display-preferences-title">
      <div class="stack-sm">
        <h2 id="display-preferences-title" class="t-h3">Aparência e leitura</h2>
        <p class="t-body-sm muted">{{ savedWhere() }}</p>
      </div>
      <div class="stack-sm">
        <p class="t-label">Tema</p>
        <app-segmented-control label="Tema" [options]="themes" [value]="prefs.preferences().theme" (valueChange)="prefs.update({ theme: $event })" />
      </div>
      <div class="switches">
        <app-switch-field
          fieldId="preference-large-text"
          label="Letras maiores"
          hint="Aumenta todos os textos do app em 25%."
          [checked]="prefs.preferences().text_size === 'large'"
          (checkedChange)="prefs.update({ text_size: $event ? 'large' : 'normal' })"
        />
        <app-switch-field
          fieldId="preference-contrast"
          label="Alto contraste"
          hint="Cores mais fortes e bordas escuras, para ler sob o sol."
          [checked]="prefs.preferences().high_contrast"
          (checkedChange)="prefs.update({ high_contrast: $event })"
        />
      </div>
    </section>
  `,
  styles: `
    .switches { display: grid; border-top: 1px solid var(--line); }
    .switches app-switch-field + app-switch-field { border-top: 1px solid var(--line); }
  `
})
export class DisplayPreferences {
  protected readonly prefs = inject(PreferencesService);
  private readonly currentUser = inject(CurrentUserService);
  readonly themes = THEMES;

  readonly savedWhere = computed(() =>
    this.currentUser.user() ? 'Fica salvo na sua conta: vale em qualquer aparelho em que você entrar.' : 'Fica salvo neste aparelho.'
  );
}
