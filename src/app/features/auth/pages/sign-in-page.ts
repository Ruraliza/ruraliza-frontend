import { Component, inject, signal } from '@angular/core';
import { Location } from '@angular/common';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../data-access/auth.service';
import { CurrentUserService } from '@core/session/current-user.service';
import { ROLE_HOME } from '@core/session/roles';
import { Button } from '@shared/ui/button';
import { FormField } from '@shared/ui/form-field';
import { PasswordReveal } from '@shared/ui/password-reveal';
import { AuthPrefill, readAuthPrefill } from '../models/auth-prefill';

// Login com e-mail e senha. Uma conta por pessoa: entra no último painel usado
// (produtor ou trabalhador) e troca pelo menu, acima de "Sair".
@Component({
  selector: 'app-sign-in-page',
  imports: [ReactiveFormsModule, RouterLink, Button, FormField, PasswordReveal],
  template: `
    <div class="container page">
      <div class="page-header">
        <div>
          <h1>Entrar</h1>
          <p class="muted">Use o e-mail e a senha do seu cadastro.</p>
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
          <a appButton variant="ghost" routerLink="/entrar/esqueci-senha" [state]="prefill()">Esqueci minha senha</a>
        </div>
      </form>

      <p class="t-body-sm muted test-note">
        Ambiente de teste: entre com <b>produtor&#64;exemplo.com</b>, <b>trabalhador&#64;exemplo.com</b>
        ou <b>ambos&#64;exemplo.com</b> (tem os dois perfis), senha <b>ruraliza123</b>.
      </p>

      <p class="muted">Ainda não tem conta? <a routerLink="/cadastro">Criar conta</a></p>
    </div>
  `,
  styles: `
    .test-note { max-width: 560px; padding: var(--space-4); border-radius: var(--radius-md); background: var(--surface-sunken); }
  `
})
export class SignInPage {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly auth = inject(AuthService);
  private readonly currentUser = inject(CurrentUserService);
  private readonly router = inject(Router);
  // Vindo da redefinição de senha (ou de volta do "esqueci a senha"): já preenche o e-mail.
  private readonly initial = readAuthPrefill(inject(Location));

  readonly saving = signal(false);

  readonly form = this.fb.group({
    email: [this.initial?.email ?? '', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  // Leva o e-mail digitado para a tela de "esqueci a senha".
  prefill(): AuthPrefill {
    return { email: this.form.controls.email.value.trim() };
  }

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    const { email, password } = this.form.getRawValue();
    this.saving.set(true);
    this.auth.login({ email: email.trim(), password }).subscribe({
      next: ({ user, token }) => {
        this.currentUser.signIn(user, token);
        void this.router.navigateByUrl(ROLE_HOME[user.role]);
      },
      error: () => this.saving.set(false) // a mensagem já saiu no toast
    });
  }
}
