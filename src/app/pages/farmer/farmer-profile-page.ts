import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { FarmerService } from '../../core/api/farmer.service';
import { CurrentUserService } from '../../core/session/current-user.service';
import { ToastService } from '../../core/toast/toast.service';
import { Farmer } from '../../../models/farmer.model';
import { RemoteData } from '../../shared/utils/remote-data';
import { formatCpf, formatDate, formatPhone } from '../../shared/utils/format';
import { Button } from '../../shared/ui/button';
import { ConfirmDialog } from '../../shared/ui/confirm-dialog';
import { ErrorState } from '../../shared/ui/error-state';
import { FormField } from '../../shared/ui/form-field';
import { Icon } from '../../shared/ui/icon';
import { MaskedInput } from '../../shared/ui/masked-input';
import { Skeleton } from '../../shared/ui/skeleton';

// Perfil do produtor: leitura, edição (id e cpf fixos) e remoção da conta.
@Component({
  selector: 'app-farmer-profile-page',
  imports: [ReactiveFormsModule, Button, ConfirmDialog, ErrorState, FormField, Icon, MaskedInput, Skeleton],
  template: `
    <div class="container page">
      <div class="page-header">
        <div>
          <h1>{{ farmer.data()?.name ?? 'Perfil' }}</h1>
        </div>
      </div>

      @switch (farmer.state().status) {
        @case ('loading') { <app-skeleton [count]="1" [height]="200" /> }
        @case ('error') { <app-error-state [message]="farmer.error()" (retry)="farmer.load()" /> }
        @case ('success') {
          @if (farmer.data(); as f) {
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

                <p class="t-body-sm muted">CPF: {{ cpf(f.cpf) }} (não pode ser alterado)</p>

                <div class="form-actions">
                  <button appButton variant="secondary" type="button" [disabled]="saving()" (click)="editing.set(false)">Cancelar</button>
                  <button appButton type="submit" [loading]="saving()">Salvar alterações</button>
                </div>
              </form>
            } @else {
              <section class="card">
                <dl class="details">
                  <div><dt>E-mail</dt><dd>{{ f.email }}</dd></div>
                  <div><dt>Telefone</dt><dd>{{ phone(f.phone) }}</dd></div>
                  <div><dt>CPF</dt><dd>{{ cpf(f.cpf) }}</dd></div>
                  <div><dt>Fazendas cadastradas</dt><dd>{{ f.farms.length }}</dd></div>
                  <div><dt>No Ruraliza desde</dt><dd>{{ date(f.insertion_date) }}</dd></div>
                </dl>
              </section>

              <div class="form-actions">
                <button appButton variant="secondary" type="button" (click)="startEdit(f)">Editar perfil</button>
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
      message="Seu perfil, suas fazendas e seus serviços serão removidos do Ruraliza. Essa ação não pode ser desfeita."
      confirmLabel="Excluir conta"
      confirmVariant="danger"
      [loading]="deleting()"
      (confirmed)="remove()"
      (cancelled)="confirmingDelete.set(false)"
    />
  `
})
export class FarmerProfilePage {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly farmerService = inject(FarmerService);
  private readonly currentUser = inject(CurrentUserService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly farmerId = this.currentUser.requireId('farmer');

  readonly farmer = new RemoteData(() => this.farmerService.getFarmer(this.farmerId));

  readonly editing = signal(false);
  readonly saving = signal(false);
  readonly confirmingDelete = signal(false);
  readonly deleting = signal(false);

  readonly form = this.fb.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required, Validators.minLength(10)]]
  });

  readonly phoneMessages = { minlength: 'Digite o telefone com DDD, só números.' };

  readonly phone = formatPhone;
  readonly cpf = formatCpf;
  readonly date = formatDate;

  constructor() {
    this.farmer.load();
  }

  startEdit(farmer: Farmer): void {
    this.form.reset({ name: farmer.name, email: farmer.email, phone: farmer.phone });
    this.editing.set(true);
  }

  save(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    const { name, email, phone } = this.form.getRawValue();
    this.saving.set(true);
    this.farmerService.updateFarmer(this.farmerId, { name: name.trim(), email: email.trim(), phone }).subscribe({
      next: () => {
        this.saving.set(false);
        this.editing.set(false);
        this.toast.success('Perfil atualizado.');
        this.farmer.load();
      },
      error: () => this.saving.set(false) // a mensagem já saiu no toast
    });
  }

  remove(): void {
    this.deleting.set(true);
    this.farmerService.deleteFarmer(this.farmerId).subscribe({
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
