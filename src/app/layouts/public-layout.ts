import { Component, signal } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { Button } from '../shared/ui/button';
import { Icon } from '../shared/ui/icon';
import { Logo } from '../shared/ui/logo';

@Component({
  selector: 'app-public-layout',
  imports: [RouterOutlet, RouterLink, Button, Icon, Logo],
  template: `
    <a class="skip-link" href="#conteudo">Pular para o conteúdo</a>
    <header class="header">
      <div class="container bar">
        <a routerLink="/" class="brand" aria-label="Ruraliza, página inicial"><app-logo /></a>
        <button
          type="button"
          class="menu-toggle"
          aria-controls="public-nav"
          [attr.aria-expanded]="menuOpen()"
          [attr.aria-label]="menuOpen() ? 'Fechar menu' : 'Abrir menu'"
          (click)="menuOpen.set(!menuOpen())"
        >
          <app-icon [name]="menuOpen() ? 'x' : 'menu'" />
        </button>
        <nav id="public-nav" class="nav" [class.open]="menuOpen()" aria-label="Principal" (click)="menuOpen.set(false)">
          <a routerLink="/">Início</a>
          <a routerLink="/" fragment="como-funciona">Como funciona</a>
          <a routerLink="/" fragment="produtores">Para produtores</a>
          <a routerLink="/" fragment="trabalhadores">Para trabalhadores</a>
          <a appButton routerLink="/cadastro">Criar conta</a>
        </nav>
      </div>
    </header>

    <main id="conteudo" tabindex="-1"><router-outlet /></main>

    <footer class="footer">
      <div class="container footer-inner">
        <app-logo [size]="28" />
        <p class="t-body-sm muted">Conectar quem precisa produzir a quem sabe executar.</p>
        <nav class="footer-links t-body-sm" aria-label="Rodapé">
          <a routerLink="/cadastro">Criar conta</a>
          <a routerLink="/entrar">Entrar com perfil de teste</a>
        </nav>
      </div>
    </footer>
  `,
  styles: `
    :host { display: flex; flex-direction: column; min-height: 100dvh; }
    main { flex: 1; }
    main:focus { outline: none; }
    .skip-link { position: absolute; left: var(--space-4); top: -100px; z-index: 60; padding: var(--space-2) var(--space-4); background: var(--surface-raised); border-radius: var(--radius-sm); }
    .skip-link:focus { top: var(--space-2); }

    .header { position: sticky; top: 0; z-index: 30; background: var(--surface); border-bottom: 1px solid var(--line); }
    .bar { display: flex; align-items: center; justify-content: space-between; gap: var(--space-4); min-height: 64px; }
    .brand { display: inline-flex; text-decoration: none; color: inherit; min-height: 44px; align-items: center; }
    .menu-toggle { display: grid; place-items: center; width: 48px; height: 48px; border: 0; border-radius: var(--radius-sm); background: transparent; color: var(--ink); }

    .nav { display: none; }
    .nav.open {
      position: absolute; top: 64px; left: 0; right: 0; display: grid; gap: var(--space-1);
      padding: var(--space-4); background: var(--surface-raised); border-bottom: 1px solid var(--line); box-shadow: var(--shadow-float);
    }
    .nav a:not([appButton]) { display: flex; align-items: center; min-height: 48px; padding: 0 var(--space-3); color: var(--ink); font-weight: 600; text-decoration: none; border-radius: var(--radius-sm); }
    .nav a:not([appButton]):hover { background: var(--surface-sunken); }

    @media (min-width: 1024px) {
      .menu-toggle { display: none; }
      .nav, .nav.open { position: static; display: flex; align-items: center; gap: var(--space-2); padding: 0; background: none; border: 0; box-shadow: none; }
    }

    .footer { border-top: 1px solid var(--line); background: var(--surface-sunken); }
    .footer-inner { display: grid; gap: var(--space-3); padding-block: var(--space-8); }
    .footer-links { display: flex; flex-wrap: wrap; gap: var(--space-4); }
    .footer-links a { min-height: 44px; display: inline-flex; align-items: center; }
  `
})
export class PublicLayout {
  readonly menuOpen = signal(false);
}
