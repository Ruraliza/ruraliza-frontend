import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { tap } from 'rxjs';
import { AdminService } from '../data-access/admin.service';
import { SYSTEM_ROLE_LABEL, SystemSessionService } from '@core/session/system-session.service';
import { ToastService } from '@core/toast/toast.service';
import { SystemRole, SystemUser } from '@core/models/system.model';
import { RemoteData } from '@shared/utils/remote-data';
import { Button } from '@shared/ui/button';
import { ErrorState } from '@shared/ui/error-state';
import { FormField } from '@shared/ui/form-field';
import { Icon } from '@shared/ui/icon';
import { SegmentOption, SegmentedControl } from '@shared/ui/segmented-control';
import { Skeleton } from '@shared/ui/skeleton';

// Edição de um membro da equipe pelo administrador: nome, e-mail e cargo.
// O próprio cargo não muda (a equipe não pode ficar sem administrador).
@Component({
  selector: 'app-staff-edit-page',
  imports: [ReactiveFormsModule, RouterLink, Button, ErrorState, FormField, Icon, SegmentedControl, Skeleton],
  template: `
    <div class="container page">
      <a class="back-link" routerLink="/sistema/equipe"><app-icon name="arrow-left" [size]="20" />Equipe</a>

      @switch (member.state().status) {
        @case ('loading') { <app-skeleton [count]="1" [height]="280" /> }
        @case ('error') { <app-error-state [message]="member.error()" (retry)="member.load()" /> }
        @case ('success') {
          @if (member.data(); as m) {
            <div class="page-header">
              <div>
                <h1>Editar {{ m.name }}</h1>
                @if (isMe()) { <p class="muted">Este é o seu usuário.</p> }
              </div>
            </div>

            <form class="form card" [formGroup]="form" (ngSubmit)="save(m)" novalidate>
              <div class="stack-sm">
                <span class="t-label">Cargo</span>
                @if (isMe()) {
                  <p>{{ roleLabel[m.role] }}</p>
                  <p class="t-body-sm muted">Você não pode alterar o próprio cargo. Peça a outro administrador.</p>
                } @else {
                  <app-segmented-control [options]="roles" [(value)]="role" label="Cargo" />
                }
              </div>

              <app-form-field label="Nome" fieldId="name" [control]="form.controls.name">
                <input formControlName="name" autocomplete="off" maxlength="120">
              </app-form-field>

              <app-form-field label="E-mail" fieldId="email" hint="É o e-mail que a pessoa usa para entrar." [control]="form.controls.email">
                <input type="email" formControlName="email" autocomplete="off">
              </app-form-field>

              <div class="form-actions">
                <a appButton variant="secondary" routerLink="/sistema/equipe">Cancelar</a>
                <button appButton type="submit" [loading]="saving()">Salvar alterações</button>
              </div>
            </form>
          }
        }
      }
    </div>
  `
})
export class StaffEditPage implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly admin = inject(AdminService);
  private readonly session = inject(SystemSessionService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  readonly id = input.required<string>(); // parâmetro :id da rota
  private readonly memberId = computed(() => Number(this.id()));
  readonly isMe = computed(() => this.memberId() === this.session.user()?.id);

  // Cada carga (inclusive o "Tentar de novo") preenche o formulário com os dados atuais.
  readonly member = new RemoteData(() =>
    this.admin.getSystemUser(this.memberId()).pipe(
      tap((m) => {
        this.form.reset({ name: m.name, email: m.email });
        this.role.set(m.role);
      })
    )
  );

  readonly roles: SegmentOption<SystemRole>[] = [
    { value: 'admin', label: SYSTEM_ROLE_LABEL.admin },
    { value: 'tutor', label: SYSTEM_ROLE_LABEL.tutor }
  ];
  readonly roleLabel = SYSTEM_ROLE_LABEL;
  readonly role = signal<SystemRole>('tutor');
  readonly saving = signal(false);

  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(120)]],
    email: ['', [Validators.required, Validators.email]]
  });

  // O :id da rota só está disponível depois que os inputs são ligados.
  ngOnInit(): void {
    this.member.load();
  }

  save(current: SystemUser): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    const { name, email } = this.form.getRawValue();
    const changes = { name: name.trim(), email: email.trim(), ...(this.isMe() ? {} : { role: this.role() }) };
    this.saving.set(true);
    this.admin.updateSystemUser(current.id, changes).subscribe({
      next: ({ system_user }) => {
        if (this.isMe()) this.session.update(system_user);
        this.toast.success('Dados atualizados.');
        void this.router.navigateByUrl('/sistema/equipe');
      },
      error: () => this.saving.set(false) // a mensagem já saiu no toast
    });
  }
}
