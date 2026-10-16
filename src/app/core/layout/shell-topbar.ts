import { Component, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Avatar } from '@shared/domain/ui/avatar';
import { Icon } from '@shared/ui/icon';
import { Logo } from '@shared/ui/logo';
import type { ShellProfile } from './app-shell';

// Barra de cima das áreas logadas no celular (< 1024px): a marca leva ao Início e o avatar, ao perfil.
// Fica grudada no topo, abaixo da área do relógio do app instalado (--safe-top).
@Component({
  selector: 'app-shell-topbar',
  imports: [RouterLink, RouterLinkActive, Avatar, Icon, Logo],
  host: { role: 'banner' },
  template: `
    <a class="home" [routerLink]="homeLink()" [attr.aria-label]="'RURALIZA, início da ' + areaLabel().toLowerCase()">
      <app-logo [size]="28" />
    </a>
    <div class="actions">
      @if (profile(); as p) {
        <a class="me" [routerLink]="p.link" routerLinkActive="active" ariaCurrentWhenActive="page" aria-label="Seu perfil">
          @if (p.name) { <app-avatar [name]="p.name" [photoUrl]="p.photoUrl" [size]="36" /> }
          @else { <span class="fallback"><app-icon name="user" [size]="22" /></span> }
        </a>
      }
    </div>
  `,
  styles: `
    :host {
      position: sticky; top: 0; z-index: 30;
      display: flex; align-items: center; justify-content: space-between; gap: var(--space-3);
      height: calc(var(--topbar-height) + var(--safe-top)); padding: var(--safe-top) var(--space-2) 0 var(--space-4);
      background: var(--surface-raised); border-bottom: 1px solid var(--line);
    }
    .home {
      display: inline-flex; align-items: center; min-height: 44px; padding-inline: var(--space-1);
      margin-left: calc(-1 * var(--space-1)); border-radius: var(--radius-sm); text-decoration: none;
    }
    .actions { display: flex; align-items: center; gap: var(--space-1); }
    .me { display: grid; place-items: center; width: 48px; height: 48px; border-radius: 50%; color: var(--ink); }
    .fallback { display: grid; place-items: center; width: 36px; height: 36px; border-radius: 50%; background: var(--broto-soft); }
    .me app-avatar, .fallback { transition: box-shadow .15s ease; }
    /* No perfil, o avatar ganha o anel verde: é o "item ativo" da barra de cima. */
    .me.active app-avatar, .me.active .fallback { box-shadow: 0 0 0 2px var(--surface-raised), 0 0 0 4px var(--mata); }
    @media (min-width: 1024px) { :host { display: none; } }
    @media print { :host { display: none !important; } }
  `
})
export class ShellTopbar {
  readonly homeLink = input.required<string>();
  readonly areaLabel = input.required<string>();
  readonly profile = input<ShellProfile | null>(null);
}
