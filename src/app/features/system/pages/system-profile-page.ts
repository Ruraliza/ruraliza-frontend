import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { SystemAuthService } from '../data-access/system-auth.service';
import { SYSTEM_ROLE_LABEL, SystemSessionService } from '@core/session/system-session.service';
import { ToastService } from '@core/toast/toast.service';
import { SystemUser } from '@core/models/system.model';
import { formatDate } from '@shared/utils/format';
import { Avatar } from '@shared/domain/ui/avatar';
import { Button } from '@shared/ui/button';
import { FormField } from '@shared/ui/form-field';
import { Icon } from '@shared/ui/icon';

// Perfil do próprio usuário de sistema: nome e e-mail. O cargo só um administrador muda.
@Component({
  selector: 'app-system-profile-page',
  imports: [ReactiveFormsModule, Avatar, Button, FormField, Icon],
  template: `
    <div class="container page">
      @if (session.user(); as user) {
        <div class="page-header">
          <div class="who">
            <app-avatar [name]="user.name" [size]="64" />
            <div>
              <p class="t-overline muted">{{ roleLabel[user.role] }}</p>
              <h1>{{ user.name }}</h1>
            </div>
          </div>
        </div>

        @if (editing()) {
          <form class="form card" [formGroup]="form" (ngSubmit)="save()" novalidate>
            <app-form-field label="Nome" fieldId="name" [control]="form.controls.name">
              <input formControlName="name" autocomplete="name" maxlength="120">
            </app-form-field>

            <app-form-field label="E-mail" fieldId="email" hint="É o e-mail que você usa para entrar." [control]="form.controls.email">
              <input type="email" formControlName="email" autocomplete="email">
            </app-form-field>

            <p class="t-body-sm muted">Cargo: {{ roleLabel[user.role] }} (só um administrador pode alterar)</p>

            <div class="form-actions">
              <button appButton variant="secondary" type="button" [disabled]="saving()" (click)="editing.set(false)">Cancelar</button>
              <button appButton type="submit" [loading]="saving()">Salvar alterações</button>
            </div>
          </form>
        } @else {
          <section class="card">
            <dl class="details">
              <div><dt>E-mail</dt><dd>{{ user.email }}</dd></div>
              <div><dt>Cargo</dt><dd>{{ roleLabel[user.role] }}</dd></div>
              <div><dt>Na equipe desde</dt><dd>{{ date(user.insertion_date) }}</dd></div>
            </dl>
          </section>

          <div class="form-actions">
            <button appButton variant="secondary" type="button" (click)="startEdit(user)">Editar perfil</button>
          </div>
        }
      }

      <div class="cluster">
        <button appButton variant="secondary" type="button" (click)="signOut()"><app-icon name="logout" [size]="20" />Sair</button>
      </div>
    </div>
  `,
  styles: `
    .who { display: flex; align-items: center; gap: var(--space-4); }
  `
})
export class SystemProfilePage {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly auth = inject(SystemAuthService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  protected readonly session = inject(SystemSessionService);

  readonly roleLabel = SYSTEM_ROLE_LABEL;
  readonly date = formatDate;
  readonly editing = signal(false);
  readonly saving = signal(false);

  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(120)]],
    email: ['', [Validators.required, Validators.email]]
  });

  constructor() {
    // Dados atuais (um administrador pode ter mudado nome, e-mail ou cargo).
    this.auth.me().subscribe({ next: (user) => this.session.update(user), error: () => undefined });
  }

  startEdit(user: SystemUser): void {
    this.form.reset({ name: user.name, email: user.email });
    this.editing.set(true);
  }

  save(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    const { name, email } = this.form.getRawValue();
    this.saving.set(true);
    this.auth.updateMe({ name: name.trim(), email: email.trim() }).subscribe({
      next: ({ system_user }) => {
        this.saving.set(false);
        this.editing.set(false);
        this.session.update(system_user);
        this.toast.success('Perfil atualizado.');
      },
      error: () => this.saving.set(false) // a mensagem já saiu no toast
    });
  }

  signOut(): void {
    this.session.clear();
    void this.router.navigateByUrl('/sistema/entrar');
  }
}
