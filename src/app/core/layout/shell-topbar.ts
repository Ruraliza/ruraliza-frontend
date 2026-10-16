import { Component, inject, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Avatar } from '@shared/domain/ui/avatar';
import { Icon } from '@shared/ui/icon';
import { Logo } from '@shared/ui/logo';
import { PreferencesService } from '../preferences/preferences.service';
import type { ShellNotifications, ShellProfile } from './app-shell';

// Barra de cima das áreas logadas no celular (< 1024px): a marca leva ao Início; à direita, o atalho de
// leitura fácil (letras maiores + alto contraste), o sino da central de notificações e o avatar (perfil).
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
      <button
        type="button"
        class="icon-button"
        [attr.aria-pressed]="prefs.easyReading()"
        aria-label="Letras maiores e alto contraste"
        title="Letras maiores e alto contraste"
        (click)="prefs.toggleEasyReading()"
      >
        <app-icon name="text-size" />
      </button>
      @if (notifications(); as n) {
        <a class="icon-button bell" [routerLink]="n.link" routerLinkActive="active" ariaCurrentWhenActive="page" [attr.aria-label]="bellLabel(n.unread)">
          <app-icon name="bell" />
          @if (n.unread) { <span class="count" aria-hidden="true">{{ n.unread > 99 ? '99+' : n.unread }}</span> }
        </a>
      }
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
    .icon-button {
      display: grid; place-items: center; width: 48px; height: 48px; padding: 0;
      border: 0; border-radius: 50%; background: transparent; color: var(--ink);
    }
    .icon-button:hover { background: var(--surface-sunken); }
    .icon-button[aria-pressed="true"], .icon-button.active { background: var(--broto-soft); }
    .bell { position: relative; }
    .count {
      position: absolute; top: 4px; right: 2px; min-width: 20px; height: 20px; padding: 0 5px; border-radius: var(--radius-pill);
      background: var(--orange-500); color: var(--on-accent); box-shadow: 0 0 0 2px var(--surface-raised);
      font-size: 12px; font-weight: 800; line-height: 20px; text-align: center;
    }
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
  protected readonly prefs = inject(PreferencesService);
  readonly homeLink = input.required<string>();
  readonly areaLabel = input.required<string>();
  readonly profile = input<ShellProfile | null>(null);
  readonly notifications = input<ShellNotifications | null>(null);

  bellLabel(unread: number): string {
    if (!unread) return 'Notificações';
    return `Notificações, ${unread === 1 ? '1 não lida' : `${unread} não lidas`}`;
  }
}
