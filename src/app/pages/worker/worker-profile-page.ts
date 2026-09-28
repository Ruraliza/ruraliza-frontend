import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { WorkerService } from '../../core/api/worker.service';
import { CurrentUserService } from '../../core/session/current-user.service';
import { ToastService } from '../../core/toast/toast.service';
import { Worker } from '../../../models/worker.model';
import { RemoteData } from '../../shared/utils/remote-data';
import { formatCpf, formatDate, formatPhone } from '../../shared/utils/format';
import { Button } from '../../shared/ui/button';
import { ConfirmDialog } from '../../shared/ui/confirm-dialog';
import { ErrorState } from '../../shared/ui/error-state';
import { FormField } from '../../shared/ui/form-field';
import { Icon } from '../../shared/ui/icon';
import { MaskedInput } from '../../shared/ui/masked-input';
import { Skeleton } from '../../shared/ui/skeleton';

// Perfil do trabalhador: leitura, edição (id e cpf fixos) e remoção da conta.
@Component({
  selector: 'app-worker-profile-page',
  imports: [ReactiveFormsModule, Button, ConfirmDialog, ErrorState, FormField, Icon, MaskedInput, Skeleton],
  template: `
    <div class="container page">
      <div class="page-header">
        <div>
          <h1>{{ worker.data()?.name ?? 'Perfil' }}</h1>
        </div>
      </div>

      @switch (worker.state().status) {
        @case ('loading') { <app-skeleton [count]="1" [height]="200" /> }
        @case ('error') { <app-error-state [message]="worker.error()" (retry)="worker.load()" /> }
        @case ('success') {
          @if (worker.data(); as w) {
            @if (editing()) {
              <form class="form card" [formGroup]="form" (ngSubmit)="save()" novalidate>
                <app-form-field label="Nome completo" fieldId="name" [control]="form.controls.name">
                  <input formControlName="name" autocomplete="name">
                </app-form-field>

                <app-form-field label="E-mail" fieldId="email" [control]="form.controls.email">
                  <input type="email" formControlName="email" autocomplete="email">
                </app-form-field>

                <app-form-field label="Telefone (WhatsApp)" fieldId="phone" [control]="form.controls.phone" [messages]="phoneMessages">
                  <input appMask="phone" formControlName="phone" inputmode="numeric" autocomplete="tel">
                </app-form-field>

                <app-form-field label="Experiência" fieldId="experience" [optional]="true" hint="Ex.: 5 anos em colheita de café." [control]="form.controls.experience">
                  <input formControlName="experience">
                </app-form-field>

                <app-form-field label="Certificados" fieldId="certificates" [optional]="true" hint="Ex.: NR-31, curso de tratorista." [control]="form.controls.certificates">
                  <input formControlName="certificates">
                </app-form-field>

                <p class="t-body-sm muted">CPF: {{ cpf(w.cpf) }} (não pode ser alterado)</p>

                <div class="form-actions">
                  <button appButton variant="secondary" type="button" [disabled]="saving()" (click)="editing.set(false)">Cancelar</button>
                  <button appButton type="submit" [loading]="saving()">Salvar alterações</button>
                </div>
              </form>
            } @else {
              <section class="card">
                <dl class="details">
                  <div><dt>E-mail</dt><dd>{{ w.email }}</dd></div>
                  <div><dt>Telefone</dt><dd>{{ phone(w.phone) }}</dd></div>
                  <div><dt>CPF</dt><dd>{{ cpf(w.cpf) }}</dd></div>
                  <div><dt>Experiência</dt><dd>{{ w.experience || 'Não informada' }}</dd></div>
                  <div><dt>Certificados</dt><dd>{{ w.certificates || 'Nenhum informado' }}</dd></div>
                  <div><dt>No Ruraliza desde</dt><dd>{{ date(w.insertion_date) }}</dd></div>
                </dl>
              </section>

              <div class="form-actions">
                <button appButton variant="secondary" type="button" (click)="startEdit(w)">Editar perfil</button>
                <button appButton variant="danger" type="button" (click)="confirmingDelete.set(true)">Excluir conta</button>
              </div>
            }
          }
        }
      }

      <div>
        <button appButton variant="secondary" type="button" (click)="switchProfile()"><app-icon name="logout" [size]="20" />Trocar perfil de teste</button>
      </div>
    </div>

    <app-confirm-dialog
      [open]="confirmingDelete()"
      title="Excluir conta?"
      message="Seu perfil e suas candidaturas serão removidos do Ruraliza. Essa ação não pode ser desfeita."
      confirmLabel="Excluir conta"
      confirmVariant="danger"
      [loading]="deleting()"
      (confirmed)="remove()"
      (cancelled)="confirmingDelete.set(false)"
    />
  `
})
export class WorkerProfilePage {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly workerService = inject(WorkerService);
  private readonly currentUser = inject(CurrentUserService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly workerId = this.currentUser.requireId('worker');

  readonly worker = new RemoteData(() => this.workerService.getWorker(this.workerId));

  readonly editing = signal(false);
  readonly saving = signal(false);
  readonly confirmingDelete = signal(false);
  readonly deleting = signal(false);

  readonly form = this.fb.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required, Validators.minLength(10)]],
    experience: [''],
    certificates: ['']
  });

  readonly phoneMessages = { minlength: 'Digite o telefone com DDD, só números.' };

  readonly phone = formatPhone;
  readonly cpf = formatCpf;
  readonly date = formatDate;

  constructor() {
    this.worker.load();
  }

  startEdit(worker: Worker): void {
    this.form.reset({
      name: worker.name,
      email: worker.email,
      phone: worker.phone,
      experience: worker.experience ?? '',
      certificates: worker.certificates ?? ''
    });
    this.editing.set(true);
  }

  save(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    const { name, email, phone, experience, certificates } = this.form.getRawValue();
    this.saving.set(true);
    this.workerService
      .updateWorker(this.workerId, {
        name: name.trim(),
        email: email.trim(),
        phone,
        experience: experience.trim() || null,
        certificates: certificates.trim() || null
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.editing.set(false);
          this.toast.success('Perfil atualizado.');
          this.worker.load();
        },
        error: () => this.saving.set(false) // a mensagem já saiu no toast
      });
  }

  remove(): void {
    this.deleting.set(true);
    this.workerService.deleteWorker(this.workerId).subscribe({
      next: () => {
        this.toast.success('Conta excluída.');
        this.switchProfile();
      },
      error: () => this.deleting.set(false)
    });
  }

  switchProfile(): void {
    this.currentUser.clear();
    this.router.navigateByUrl('/entrar');
  }
}
