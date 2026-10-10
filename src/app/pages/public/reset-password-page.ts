import { Component, inject, signal } from '@angular/core';
import { Location } from '@angular/common';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/api/auth.service';
import { ToastService } from '../../core/toast/toast.service';
import { Button } from '../../shared/ui/button';
import { EmptyState } from '../../shared/ui/empty-state';
import { FormField } from '../../shared/ui/form-field';
import { PasswordReveal } from '../../shared/ui/password-reveal';
import { CONFIRMATION_MESSAGES, PASSWORD_HINT, PASSWORD_MESSAGES, matchesField, passwordValidators, revalidateWith } from '../../shared/utils/password';
import { AuthPrefill, readResetState } from './auth-prefill';

// Esqueci a senha, passo 2: cria a nova senha com o token do passo 1 (vem pelo state da navegação).
@Component({
  selector: 'app-reset-password-page',
  imports: [ReactiveFormsModule, RouterLink, Button, EmptyState, FormField, PasswordReveal],
  template: `
    <div class="container page">
      <a class="back-link" routerLink="/entrar">← Voltar para o login</a>

      @if (reset; as r) {
        <div class="page-header">
          <div>
            <h1>Crie uma nova senha</h1>
            <p class="muted">Para a conta <b>{{ r.email }}</b>. A nova senha vale para os perfis de produtor e de trabalhador.</p>
          </div>
        </div>

        <form class="form card" [formGroup]="form" (ngSubmit)="submit(r.token)" novalidate>
          <!-- Ajuda o gerenciador de senhas a salvar a nova senha para o e-mail certo. -->
          <input type="email" class="visually-hidden" [value]="r.email" autocomplete="username" tabindex="-1" aria-hidden="true" readonly>

          <app-form-field label="Nova senha" fieldId="password" [hint]="passwordHint" [control]="form.controls.password" [messages]="passwordMessages">
            <app-password-reveal>
              <input type="password" formControlName="password" autocomplete="new-password">
            </app-password-reveal>
          </app-form-field>

          <app-form-field label="Repita a nova senha" fieldId="confirmation" [control]="form.controls.confirmation" [messages]="confirmationMessages">
            <app-password-reveal>
              <input type="password" formControlName="confirmation" autocomplete="new-password">
            </app-password-reveal>
          </app-form-field>

          <div class="form-actions">
            <button appButton type="submit" [loading]="saving()">Salvar nova senha</button>
          </div>
        </form>
      } @else {
        <app-empty-state
          icon="alert"
          title="Pedido de redefinição não encontrado"
          message="Para criar uma nova senha, comece informando o e-mail do seu cadastro."
        >
          <a appButton routerLink="/entrar/esqueci-senha">Esqueci minha senha</a>
        </app-empty-state>
      }
    </div>
  `
})
export class ResetPasswordPage {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  readonly reset = readResetState(inject(Location));
  readonly saving = signal(false);

  readonly form = this.fb.group({
    password: ['', passwordValidators],
    confirmation: ['', [Validators.required, matchesField('password')]]
  });

  readonly passwordHint = PASSWORD_HINT;
  readonly passwordMessages = PASSWORD_MESSAGES;
  readonly confirmationMessages = CONFIRMATION_MESSAGES;

  constructor() {
    revalidateWith(this.form.controls.password, this.form.controls.confirmation);
  }

  submit(token: string): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    this.saving.set(true);
    this.auth.resetPassword({ token, password: this.form.controls.password.value }).subscribe({
      next: () => {
        this.toast.success('Senha redefinida. Entre com a nova senha.');
        const state: AuthPrefill = { email: this.reset?.email ?? '' };
        // replaceUrl: voltar no navegador não reabre esta tela com o token já usado.
        this.router.navigateByUrl('/entrar', { state, replaceUrl: true });
      },
      error: () => this.saving.set(false) // a mensagem já saiu no toast
    });
  }
}
