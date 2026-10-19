import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { SystemAuthService } from '../data-access/system-auth.service';
import { SystemSessionService } from '@core/session/system-session.service';
import { Button } from '@shared/ui/button';
import { FormField } from '@shared/ui/form-field';
import { PasswordReveal } from '@shared/ui/password-reveal';
import { SYSTEM_TEST_ACCOUNTS, TEST_PASSWORD, TestAccount, TestAccounts } from '@shared/domain/ui/test-accounts';

// Login da equipe do Ruraliza. Não há cadastro: quem cria usuários de sistema é um administrador.
@Component({
  selector: 'app-system-sign-in-page',
  imports: [ReactiveFormsModule, Button, FormField, PasswordReveal, TestAccounts],
  template: `
    <div class="container page">
      <div class="page-header">
        <div>
          <h1>Acesso da equipe</h1>
          <p class="muted">Área restrita a administradores e tutores do Ruraliza.</p>
        </div>
      </div>

      <form class="form card" [formGroup]="form" (ngSubmit)="submit()" novalidate>
        <app-form-field label="E-mail" fieldId="email" [control]="form.controls.email">
          <input type="email" formControlName="email" autocomplete="username" placeholder="nome@exemplo.com">
        </app-form-field>

        <app-form-field label="Senha" fieldId="password" [control]="form.controls.password">
          <app-password-reveal>
            <input type="password" formControlName="password" autocomplete="current-password">
          </app-password-reveal>
        </app-form-field>

        <div class="form-actions">
          <button appButton type="submit" [loading]="saving()">Entrar</button>
        </div>
      </form>

      <app-test-accounts [accounts]="testAccounts" (pick)="useTestAccount($event)" />
    </div>
  `
})
export class SystemSignInPage {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly auth = inject(SystemAuthService);
  private readonly session = inject(SystemSessionService);
  private readonly router = inject(Router);

  // Administrador de teste do seed da API, que sobe também em produção enquanto o app é só de demonstração.
  readonly testAccounts = SYSTEM_TEST_ACCOUNTS;
  readonly saving = signal(false);

  readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  useTestAccount(account: TestAccount): void {
    this.form.setValue({ email: account.email, password: TEST_PASSWORD });
    this.submit();
  }

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    const { email, password } = this.form.getRawValue();
    this.saving.set(true);
    this.auth.login({ email: email.trim(), password }).subscribe({
      next: ({ user, token }) => {
        this.session.signIn(user, token);
        void this.router.navigateByUrl('/sistema');
      },
      error: () => this.saving.set(false) // a mensagem já saiu no toast
    });
  }
}
