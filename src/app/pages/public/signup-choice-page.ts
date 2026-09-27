import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icon } from '../../shared/ui/icon';

@Component({
  selector: 'app-signup-choice-page',
  imports: [RouterLink, Icon],
  template: `
    <div class="container page">
      <div class="page-header">
        <div>
          <h1>Como você vai usar o Ruraliza?</h1>
        </div>
      </div>

      <div class="choices">
        <a class="choice" routerLink="/cadastro/produtor">
          <span class="icon"><app-icon name="farm" [size]="32" /></span>
          <span class="t-h2">Sou produtor</span>
          <span class="muted">Publico serviços na minha fazenda e escolho quem vai executar.</span>
          <span class="go">Cadastrar como produtor</span>
        </a>
        <a class="choice" routerLink="/cadastro/trabalhador">
          <span class="icon"><app-icon name="briefcase" [size]="32" /></span>
          <span class="t-h2">Sou trabalhador</span>
          <span class="muted">Procuro vagas no campo e me candidato aos serviços.</span>
          <span class="go">Cadastrar como trabalhador</span>
        </a>
      </div>

      <p class="muted">Já criou um perfil de teste? <a routerLink="/entrar">Entrar com perfil de teste</a></p>
    </div>
  `,
  styles: `
    .choices { display: grid; gap: var(--space-4); grid-template-columns: repeat(auto-fit, minmax(min(100%, 320px), 1fr)); }
    .choice {
      display: grid; gap: var(--space-3); align-content: start; padding: var(--space-8);
      border-radius: var(--radius-lg); border: 2px solid var(--line); background: var(--surface-raised);
      color: var(--ink); text-decoration: none; box-shadow: var(--shadow-card);
    }
    .choice:hover { border-color: var(--mata); }
    .icon { display: grid; place-items: center; width: 64px; height: 64px; border-radius: var(--radius-md); background: var(--broto-soft); }
    .go { display: inline-flex; align-items: center; gap: var(--space-2); margin-top: var(--space-2); color: var(--mata); font-weight: 600; }
  `
})
export class SignupChoicePage {}
