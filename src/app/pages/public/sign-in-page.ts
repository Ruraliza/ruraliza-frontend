import { Component, inject, signal } from '@angular/core';
import { Location } from '@angular/common';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/api/auth.service';
import { CurrentUserService, UserRole } from '../../core/session/current-user.service';
import { Button } from '../../shared/ui/button';
import { FormField } from '../../shared/ui/form-field';
import { PasswordReveal } from '../../shared/ui/password-reveal';
import { SegmentOption, SegmentedControl } from '../../shared/ui/segmented-control';
import { AuthPrefill, readAuthPrefill } from './auth-prefill';

const HOME: Record<UserRole, string> = { farmer: '/produtor', worker: '/trabalhador' };

// Login com e-mail e senha. O mesmo e-mail pode ter perfil de produtor e de trabalhador,
// então a pessoa escolhe com qual entrar.
@Component({
  selector: 'app-sign-in-page',
  imports: [ReactiveFormsModule, RouterLink, Button, FormField, PasswordReveal, SegmentedControl],
  template: `
    <div class="container page">
      <div class="page-header">
        <div>
          <h1>Entrar</h1>
          <p class="muted">Use o e-mail e a senha do seu cadastro.</p>
        </div>
      </div>

      <form class="form card" [formGroup]="form" (ngSubmit)="submit()" novalidate>
        <app-segmented-control label="Entrar como" [options]="roleOptions" [(value)]="role" />

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
        Ambiente de teste: entre com <b>produtor&#64;exemplo.com</b> ou <b>trabalhador&#64;exemplo.com</b>, senha <b>ruraliza123</b>.
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
  // Vindo da redefinição de senha (ou de volta do "esqueci a senha"): já preenche tipo e e-mail.
  private readonly initial = readAuthPrefill(inject(Location));

  readonly roleOptions: SegmentOption<UserRole>[] = [
    { value: 'farmer', label: 'Produtor' },
    { value: 'worker', label: 'Trabalhador' }
  ];
  readonly role = signal<UserRole>(this.initial?.role ?? 'farmer');
  readonly saving = signal(false);

  readonly form = this.fb.group({
    email: [this.initial?.email ?? '', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  // Leva o tipo e o e-mail digitados para a tela de "esqueci a senha".
  prefill(): AuthPrefill {
    return { role: this.role(), email: this.form.controls.email.value.trim() };
  }

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    const { email, password } = this.form.getRawValue();
    this.saving.set(true);
    this.auth.login({ role: this.role(), email: email.trim(), password }).subscribe({
      next: ({ user }) => {
        this.currentUser.set(user);
        this.router.navigateByUrl(HOME[user.role]);
      },
      error: () => this.saving.set(false) // a mensagem já saiu no toast
    });
  }
}
