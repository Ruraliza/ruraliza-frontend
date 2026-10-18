import { Component, inject, signal } from '@angular/core';
import { Location } from '@angular/common';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { environment } from '@env/environment';
import { AuthService } from '../data-access/auth.service';
import { Button } from '@shared/ui/button';
import { FormField } from '@shared/ui/form-field';
import { ResetState, readAuthPrefill } from '../models/auth-prefill';

// Esqueci a senha, passo 1: a pessoa informa o e-mail e depois digita o código que recebeu.
// A API responde igual com e sem conta e nunca devolve o código: ele chega só ao dono do e-mail.
// O envio por e-mail ainda não existe; no `npm run dev` da API, o código sai no terminal dela.
@Component({
  selector: 'app-forgot-password-page',
  imports: [ReactiveFormsModule, RouterLink, Button, FormField],
  template: `
    <div class="container page">
      <a class="back-link" routerLink="/entrar" [state]="{ email: form.controls.email.value.trim() }">← Voltar para o login</a>

      <div class="page-header">
        <div>
          <h1>Esqueci minha senha</h1>
          @if (sentTo(); as email) {
            <p class="muted" role="status">Se houver uma conta com este e-mail (<b>{{ email }}</b>), enviamos um código para ele. Digite o código abaixo.</p>
          } @else {
            <p class="muted">Informe o e-mail do cadastro. Vamos enviar um código para você criar uma nova senha.</p>
          }
        </div>
      </div>

      @if (sentTo()) {
        <form class="form card" [formGroup]="codeForm" (ngSubmit)="continueWithCode()" novalidate>
          <app-form-field label="Código" fieldId="code" [control]="codeForm.controls.code">
            <input type="text" formControlName="code" autocomplete="one-time-code" spellcheck="false">
          </app-form-field>

          <div class="form-actions">
            <button appButton type="submit">Continuar</button>
            <button appButton type="button" variant="ghost" (click)="sentTo.set(null)">Usar outro e-mail</button>
          </div>
        </form>
      } @else {
        <form class="form card" [formGroup]="form" (ngSubmit)="submit()" novalidate>
          <app-form-field label="E-mail" fieldId="email" [control]="form.controls.email">
            <input type="email" formControlName="email" autocomplete="email" placeholder="nome@exemplo.com">
          </app-form-field>

          <div class="form-actions">
            <button appButton type="submit" [loading]="saving()">Continuar</button>
          </div>
        </form>
      }

      <p class="t-body-sm muted test-note">
        @if (devBuild) {
          Ambiente de teste: o envio por e-mail ainda não existe. Com a API em <code>npm run dev</code>, o código aparece no terminal dela.
        } @else {
          O envio do código por e-mail ainda está sendo implantado. Se ele não chegar, fale com a equipe do Ruraliza pela <a routerLink="/ajuda">central de ajuda</a>.
        }
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

  readonly devBuild = !environment.production;
  readonly saving = signal(false);
  // E-mail do pedido já feito (null = ainda no passo do e-mail).
  readonly sentTo = signal<string | null>(null);

  readonly form = this.fb.group({
    email: [this.initial?.email ?? '', [Validators.required, Validators.email]]
  });

  readonly codeForm = this.fb.group({
    code: ['', Validators.required]
  });

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    const email = this.form.controls.email.value.trim();
    this.saving.set(true);
    this.auth.requestPasswordReset({ email }).subscribe({
      next: () => {
        this.saving.set(false);
        this.sentTo.set(email);
      },
      error: () => this.saving.set(false) // a mensagem já saiu no toast
    });
  }

  continueWithCode(): void {
    const email = this.sentTo();
    this.codeForm.markAllAsTouched();
    if (!email || this.codeForm.invalid) return;

    // O código vai pelo state da navegação, não pela URL (ver auth-prefill.ts).
    const state: ResetState = { email, token: this.codeForm.controls.code.value.trim() };
    void this.router.navigateByUrl('/entrar/nova-senha', { state });
  }
}
