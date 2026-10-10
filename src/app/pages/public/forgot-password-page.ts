import { Component, inject, signal } from '@angular/core';
import { Location } from '@angular/common';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/api/auth.service';
import { Button } from '../../shared/ui/button';
import { FormField } from '../../shared/ui/form-field';
import { ResetState, readAuthPrefill } from './auth-prefill';

// Esqueci a senha, passo 1: a pessoa informa o e-mail.
// O certo é a API mandar um código por e-mail; enquanto isso não existe, ela devolve o token
// e a tela segue direto para a criação da nova senha.
@Component({
  selector: 'app-forgot-password-page',
  imports: [ReactiveFormsModule, RouterLink, Button, FormField],
  template: `
    <div class="container page">
      <a class="back-link" routerLink="/entrar" [state]="{ email: form.controls.email.value.trim() }">← Voltar para o login</a>

      <div class="page-header">
        <div>
          <h1>Esqueci minha senha</h1>
          <p class="muted">Informe o e-mail do cadastro. Vamos enviar um código para você criar uma nova senha.</p>
        </div>
      </div>

      <form class="form card" [formGroup]="form" (ngSubmit)="submit()" novalidate>
        <app-form-field label="E-mail" fieldId="email" [control]="form.controls.email">
          <input type="email" formControlName="email" autocomplete="email" placeholder="nome@exemplo.com">
        </app-form-field>

        <div class="form-actions">
          <button appButton type="submit" [loading]="saving()">Continuar</button>
        </div>
      </form>

      <p class="t-body-sm muted test-note">
        Ambiente de teste: o envio do código por e-mail ainda não existe. Ao continuar, você vai direto para a criação da nova senha.
      </p>
    </div>
  `,
  styles: `
    .test-note { max-width: 560px; padding: var(--space-4); border-radius: var(--radius-md); background: var(--surface-sunken); }
  `
})
export class ForgotPasswordPage {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly initial = readAuthPrefill(inject(Location));

  readonly saving = signal(false);

  readonly form = this.fb.group({
    email: [this.initial?.email ?? '', [Validators.required, Validators.email]]
  });

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    const email = this.form.controls.email.value.trim();
    this.saving.set(true);
    this.auth.requestPasswordReset({ email }).subscribe({
      next: ({ reset_token }) => {
        // TODO(email): quando o código for por e-mail, esta tela passa a pedir o código digitado.
        const state: ResetState = { email, token: reset_token };
        this.router.navigateByUrl('/entrar/nova-senha', { state });
      },
      error: () => this.saving.set(false) // a mensagem já saiu no toast
    });
  }
}
