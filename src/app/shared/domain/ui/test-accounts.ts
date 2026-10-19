import { Component, input, output } from '@angular/core';

export interface TestAccount {
  label: string;
  email: string;
}

// Senha das contas de teste criadas pelo seed da API (mesma do README do backend).
export const TEST_PASSWORD = 'ruraliza123';

export const APP_TEST_ACCOUNTS: readonly TestAccount[] = [
  { label: 'Trabalhador', email: 'trabalhador@exemplo.com' },
  { label: 'Produtor', email: 'produtor@exemplo.com' },
  { label: 'Produtor e trabalhador', email: 'ambos@exemplo.com' }
];

export const SYSTEM_TEST_ACCOUNTS: readonly TestAccount[] = [{ label: 'Administrador', email: 'admin@exemplo.com' }];

// Contas de teste na tela de entrar, enquanto o app é só de demonstração (sem banco de dados).
// "Entrar" emite a conta; a página preenche o formulário e entra.
@Component({
  selector: 'app-test-accounts',
  template: `
    <h2 class="t-h3">Contas de teste</h2>
    <p class="t-body-sm muted">O app está em fase de teste. Entre com uma destas contas; a senha de todas é <b>{{ password }}</b>.</p>
    <ul role="list">
      @for (account of accounts(); track account.email) {
        <li>
          <span class="who"><b>{{ account.label }}</b><span class="t-body-sm muted">{{ account.email }}</span></span>
          <button type="button" (click)="pick.emit(account)" [attr.aria-label]="'Entrar como ' + account.label">Entrar</button>
        </li>
      }
    </ul>
    <ng-content />
  `,
  styles: `
    :host {
      display: grid; gap: var(--space-3); max-width: 560px; padding: var(--space-4) var(--space-4) var(--space-3);
      border-radius: var(--radius-lg); background: var(--broto-soft);
    }
    ul { display: grid; margin: 0; padding: 0; list-style: none; }
    li { display: flex; align-items: center; justify-content: space-between; gap: var(--space-3); padding-block: var(--space-2); }
    li + li { border-top: 1px solid var(--line); }
    .who { display: grid; min-width: 0; overflow-wrap: anywhere; }
    button {
      flex: none; min-height: 44px; padding: 0 var(--space-4); border: 1px solid var(--mata); border-radius: var(--radius-md);
      background: var(--surface-raised); color: var(--mata); font-weight: 700;
    }
    button:hover { background: var(--mata); color: var(--on-mata); }
  `
})
export class TestAccounts {
  readonly accounts = input.required<readonly TestAccount[]>();
  readonly pick = output<TestAccount>();
  protected readonly password = TEST_PASSWORD;
}
