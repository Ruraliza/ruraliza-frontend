import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { SystemAuthService } from '../data-access/system-auth.service';
import { SystemSessionService } from '@core/session/system-session.service';
import { Button } from '@shared/ui/button';
import { FormField } from '@shared/ui/form-field';
import { PasswordReveal } from '@shared/ui/password-reveal';

// Login da equipe do Ruraliza. Não há cadastro: quem cria usuários de sistema é um administrador.
@Component({
  selector: 'app-system-sign-in-page',
  imports: [ReactiveFormsModule, Button, FormField, PasswordReveal],
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

      <p class="t-body-sm muted test-note">
        Ambiente de teste: entre com <b>admin&#64;exemplo.com</b>, senha <b>ruraliza123</b>.
      </p>
    </div>
  `,
  styles: `
    .test-note { max-width: 560px; padding: var(--space-4); border-radius: var(--radius-md); background: var(--surface-sunken); }
  `
})
export class SystemSignInPage {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly auth = inject(SystemAuthService);
  private readonly session = inject(SystemSessionService);
  private readonly router = inject(Router);

  readonly saving = signal(false);

  readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    const { email, password } = this.form.getRawValue();
    this.saving.set(true);
    this.auth.login({ email: email.trim(), password }).subscribe({
      next: ({ user, token }) => {
        this.session.signIn(user, token);
        this.router.navigateByUrl('/sistema');
      },
      error: () => this.saving.set(false) // a mensagem já saiu no toast
    });
  }
}
