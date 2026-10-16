import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icon } from '../../ui/icon';

// Atalhos do fim das páginas de perfil: central de ajuda da área e as regras do app.
@Component({
  selector: 'app-help-links',
  imports: [RouterLink, Icon],
  template: `
    <nav class="links" aria-label="Ajuda e regras">
      <a [routerLink]="helpLink()"><app-icon name="help" [size]="20" />Central de ajuda</a>
      <a routerLink="/termos">Termos de Uso</a>
      <a routerLink="/privacidade">Política de Privacidade</a>
    </nav>
  `,
  styles: `
    .links { display: flex; flex-wrap: wrap; gap: var(--space-2) var(--space-6); }
    a { display: inline-flex; align-items: center; gap: var(--space-2); min-height: 44px; font-weight: 600; }
  `
})
export class HelpLinks {
  // Central de ajuda dentro da área (ex.: /produtor/ajuda).
  readonly helpLink = input.required<string>();
}
