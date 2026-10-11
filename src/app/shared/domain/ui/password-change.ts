import { Component, inject, input, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { ToastService } from '@core/toast/toast.service';
import { PasswordChangeInput } from '@core/models/auth.model';
import { CONFIRMATION_MESSAGES, PASSWORD_HINT, PASSWORD_MESSAGES, matchesField, passwordValidators, revalidateWith } from '../../utils/password';
import { Button } from '../../ui/button';
import { FormField } from '../../ui/form-field';
import { PasswordReveal } from '../../ui/password-reveal';

// Troca de senha com a conta aberta: confirma a senha atual, sem código por e-mail.
// Quem usa passa a chamada da API (`submit`), ex.: (input) => farmerService.changePassword(id, input).
@Component({
  selector: 'app-password-change',
  imports: [ReactiveFormsModule, Button, FormField, PasswordReveal],
  template: `
    <section class="card stack">
      <h2 class="t-h3">Senha</h2>
      @if (open()) {
        <form class="form" [formGroup]="form" (ngSubmit)="save()" novalidate>
          <app-form-field label="Senha atual" fieldId="current-password" [control]="form.controls.current">
            <app-password-reveal>
              <input type="password" formControlName="current" autocomplete="current-password">
            </app-password-reveal>
          </app-form-field>

          <app-form-field label="Nova senha" fieldId="new-password" [hint]="passwordHint" [control]="form.controls.next" [messages]="nextMessages">
            <app-password-reveal>
              <input type="password" formControlName="next" autocomplete="new-password">
            </app-password-reveal>
          </app-form-field>

          <app-form-field label="Repita a nova senha" fieldId="new-password-confirmation" [control]="form.controls.confirmation" [messages]="confirmationMessages">
            <app-password-reveal>
              <input type="password" formControlName="confirmation" autocomplete="new-password">
            </app-password-reveal>
          </app-form-field>

          <div class="form-actions">
            <button appButton variant="secondary" type="button" [disabled]="saving()" (click)="close()">Cancelar</button>
            <button appButton type="submit" [loading]="saving()">Salvar nova senha</button>
          </div>
        </form>
      } @else {
        <p class="muted">Para trocar, você confirma a senha atual. Esqueceu? Saia e use "Esqueci minha senha" na tela de login.</p>
        <div>
          <button appButton variant="secondary" type="button" (click)="open.set(true)">Alterar senha</button>
        </div>
      }
    </section>
  `
})
export class PasswordChange {
  readonly submit = input.required<(input: PasswordChangeInput) => Observable<unknown>>();

  private readonly fb = inject(NonNullableFormBuilder);
  private readonly toast = inject(ToastService);

  readonly open = signal(false);
  readonly saving = signal(false);

  readonly form = this.fb.group({
    current: ['', Validators.required],
    next: ['', passwordValidators],
    confirmation: ['', [Validators.required, matchesField('next')]]
  });

  readonly passwordHint = PASSWORD_HINT;
  readonly nextMessages = PASSWORD_MESSAGES;
  readonly confirmationMessages = CONFIRMATION_MESSAGES;

  constructor() {
    revalidateWith(this.form.controls.next, this.form.controls.confirmation);
  }

  save(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    const { current, next } = this.form.getRawValue();
    this.saving.set(true);
    this.submit()({ current_password: current, new_password: next }).subscribe({
      next: () => {
        this.toast.success('Senha alterada.');
        this.close();
      },
      error: () => this.saving.set(false) // a mensagem já saiu no toast (ex.: senha atual incorreta)
    });
  }

  close(): void {
    this.saving.set(false);
    this.form.reset();
    this.open.set(false);
  }
}
