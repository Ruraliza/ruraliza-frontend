import { Component, inject, input, signal } from '@angular/core';
import { InstallPromptService } from '../pwa/install-prompt.service';
import { Button, ButtonVariant } from '@shared/ui/button';
import { Icon } from '@shared/ui/icon';

// "Instalar app": abre o prompt do navegador (Chrome/Edge/Android). No iPhone/iPad, onde não há
// prompt, explica o caminho pelo Compartilhar. Some quando o app já está instalado.
@Component({
  selector: 'app-install-app-button',
  imports: [Button, Icon],
  template: `
    @if (installer.canInstall()) {
      <button appButton [variant]="variant()" [block]="block()" type="button" (click)="installer.install()">
        <app-icon name="download" [size]="20" />Instalar app
      </button>
    } @else if (installer.showIosHint()) {
      <button appButton [variant]="variant()" [block]="block()" type="button" [attr.aria-expanded]="showingHint()" (click)="showingHint.set(!showingHint())">
        <app-icon name="download" [size]="20" />Instalar app
      </button>
      @if (showingHint()) {
        <p class="hint">
          No Safari, toque em <app-icon name="share" [size]="18" label="Compartilhar" /> e depois em
          <strong>Adicionar à Tela de Início</strong>.
        </p>
      }
    }
  `,
  styles: `
    :host { display: contents; }
    .hint { flex-basis: 100%; display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-1); color: var(--ink-muted); font-size: 14px; }
  `
})
export class InstallAppButton {
  readonly variant = input<ButtonVariant>('secondary');
  readonly block = input(false);

  protected readonly installer = inject(InstallPromptService);
  protected readonly showingHint = signal(false);
}
