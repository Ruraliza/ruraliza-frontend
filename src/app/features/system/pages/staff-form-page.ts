import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AdminService } from '../data-access/admin.service';
import { SYSTEM_ROLE_LABEL } from '@core/session/system-session.service';
import { ToastService } from '@core/toast/toast.service';
import { SystemRole } from '@core/models/system.model';
import { CONFIRMATION_MESSAGES, PASSWORD_HINT, PASSWORD_MESSAGES, matchesField, passwordValidators, revalidateWith } from '@shared/utils/password';
import { Button } from '@shared/ui/button';
import { FormField } from '@shared/ui/form-field';
import { Icon } from '@shared/ui/icon';
import { PasswordReveal } from '@shared/ui/password-reveal';
import { SegmentOption, SegmentedControl } from '@shared/ui/segmented-control';

const ROLE_DESCRIPTION: Record<SystemRole, string> = {
  admin: 'Gerencia os usuários do app e a equipe.',
  tutor: 'Vai cadastrar e editar as trilhas de estudo (em breve).'
};

// Cadastro de usuário de sistema: o único jeito de criar um (não existe cadastro público).
@Component({
  selector: 'app-staff-form-page',
  imports: [ReactiveFormsModule, RouterLink, Button, FormField, Icon, PasswordReveal, SegmentedControl],
  template: `
    <div class="container page">
      <a class="back-link" routerLink="/sistema/equipe"><app-icon name="arrow-left" [size]="20" />Equipe</a>
      <div class="page-header">
        <div>
          <h1>Novo membro da equipe</h1>
          <p class="muted">Passe o e-mail e a senha para a pessoa: ela entra em <b>/sistema/entrar</b>.</p>
        </div>
      </div>

      <form class="form card" [formGroup]="form" (ngSubmit)="submit()" novalidate>
        <div class="stack-sm">
          <span class="t-label">Cargo</span>
          <app-segmented-control [options]="roles" [(value)]="role" label="Cargo" />
          <p class="t-body-sm muted">{{ roleDescription[role()] }}</p>
        </div>

        <app-form-field label="Nome" fieldId="name" [control]="form.controls.name">
          <input formControlName="name" autocomplete="off" maxlength="120">
        </app-form-field>

        <app-form-field label="E-mail" fieldId="email" [control]="form.controls.email">
          <input type="email" formControlName="email" autocomplete="off" placeholder="nome@exemplo.com">
        </app-form-field>

        <app-form-field label="Senha inicial" fieldId="password" [hint]="passwordHint" [control]="form.controls.password" [messages]="passwordMessages">
          <app-password-reveal>
            <input type="password" formControlName="password" autocomplete="new-password">
          </app-password-reveal>
        </app-form-field>

        <app-form-field label="Confirme a senha" fieldId="confirmation" [control]="form.controls.confirmation" [messages]="confirmationMessages">
          <app-password-reveal>
            <input type="password" formControlName="confirmation" autocomplete="new-password">
          </app-password-reveal>
        </app-form-field>

        <div class="form-actions">
          <a appButton variant="secondary" routerLink="/sistema/equipe">Cancelar</a>
          <button appButton type="submit" [loading]="saving()">Cadastrar {{ roleLabel[role()].toLowerCase() }}</button>
        </div>
      </form>
    </div>
  `
})
export class StaffFormPage {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly admin = inject(AdminService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  readonly roles: SegmentOption<SystemRole>[] = [
    { value: 'admin', label: SYSTEM_ROLE_LABEL.admin },
    { value: 'tutor', label: SYSTEM_ROLE_LABEL.tutor }
  ];
  readonly role = signal<SystemRole>('tutor');
  readonly roleLabel = SYSTEM_ROLE_LABEL;
  readonly roleDescription = ROLE_DESCRIPTION;
  readonly saving = signal(false);

  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(120)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', passwordValidators],
    confirmation: ['', [Validators.required, matchesField('password')]]
  });

  readonly passwordHint = PASSWORD_HINT;
  readonly passwordMessages = PASSWORD_MESSAGES;
  readonly confirmationMessages = CONFIRMATION_MESSAGES;

  constructor() {
    revalidateWith(this.form.controls.password, this.form.controls.confirmation);
  }

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    const { name, email, password } = this.form.getRawValue();
    this.saving.set(true);
    this.admin.createSystemUser({ name: name.trim(), email: email.trim(), role: this.role(), password }).subscribe({
      next: ({ system_user }) => {
        this.toast.success(`${system_user.name} entrou para a equipe como ${SYSTEM_ROLE_LABEL[system_user.role].toLowerCase()}.`);
        void this.router.navigateByUrl('/sistema/equipe');
      },
      error: () => this.saving.set(false) // a mensagem já saiu no toast
    });
  }
}
