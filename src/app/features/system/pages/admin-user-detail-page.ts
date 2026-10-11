import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { AdminService } from '../data-access/admin.service';
import { ToastService } from '@core/toast/toast.service';
import { Farmer } from '@core/models/farmer.model';
import { AdminUser } from '@core/models/system.model';
import { Worker } from '@core/models/worker.model';
import { RemoteData } from '@shared/utils/remote-data';
import { formatCpf, formatDate, formatPhone } from '@shared/utils/format';
import { Avatar } from '@shared/domain/ui/avatar';
import { Button } from '@shared/ui/button';
import { ConfirmDialog } from '@shared/ui/confirm-dialog';
import { ErrorState } from '@shared/ui/error-state';
import { FormField } from '@shared/ui/form-field';
import { Icon } from '@shared/ui/icon';
import { MaskedInput } from '@shared/ui/masked-input';
import { Skeleton } from '@shared/ui/skeleton';
import { accountName } from './admin-users-page';

type Removal = 'farmer' | 'worker' | 'account' | 'farmer-photo' | 'worker-photo';

const REMOVAL_TEXT: Record<Removal, { title: string; message: string; confirm: string }> = {
  farmer: {
    title: 'Remover perfil de produtor?',
    message: 'O perfil, a foto, as fazendas (com as fotos) e os serviços serão removidos. Se a conta tiver o perfil de trabalhador, ela continua com ele.',
    confirm: 'Remover perfil'
  },
  worker: {
    title: 'Remover perfil de trabalhador?',
    message: 'O perfil, a foto, o currículo e as candidaturas serão removidos. Se a conta tiver o perfil de produtor, ela continua com ele.',
    confirm: 'Remover perfil'
  },
  'farmer-photo': {
    title: 'Remover foto do produtor?',
    message: 'A foto de perfil de produtor será apagada. A pessoa pode enviar outra depois.',
    confirm: 'Remover foto'
  },
  'worker-photo': {
    title: 'Remover foto do trabalhador?',
    message: 'A foto de perfil de trabalhador será apagada. A pessoa pode enviar outra depois.',
    confirm: 'Remover foto'
  },
  account: {
    title: 'Remover conta?',
    message: 'A conta e os perfis dela (com fazendas, serviços, candidaturas, fotos e currículo) serão removidos. A pessoa não consegue mais entrar.',
    confirm: 'Remover conta'
  }
};

const MAX_BIO = 500;
const MAX_LONG_TEXT = 1000;

// Uma conta do app: dados de cada perfil, edição e remoção (de um perfil ou da conta inteira).
@Component({
  selector: 'app-admin-user-detail-page',
  imports: [ReactiveFormsModule, RouterLink, Avatar, Button, ConfirmDialog, ErrorState, FormField, Icon, MaskedInput, Skeleton],
  template: `
    <div class="container page">
      <a class="back-link" routerLink="/sistema/usuarios"><app-icon name="arrow-left" [size]="20" />Usuários</a>

      @switch (user.state().status) {
        @case ('loading') { <app-skeleton [count]="2" [height]="200" /> }
        @case ('error') { <app-error-state [message]="user.error()" (retry)="user.load()" /> }
        @case ('success') {
          @if (user.data(); as u) {
            <div class="page-header">
              <div class="who">
                <app-avatar [name]="name(u)" [photoUrl]="u.farmer?.photo_url ?? u.worker?.photo_url ?? null" [size]="64" />
                <div>
                  <h1>{{ name(u) }}</h1>
                  <p class="muted">{{ u.email }} · conta {{ u.account_id }}</p>
                </div>
              </div>
            </div>

            @if (u.farmer; as f) {
              <section class="card stack">
                <h2 class="t-h3">Perfil de produtor</h2>
                <div class="photo">
                  <app-avatar [name]="f.name" [photoUrl]="f.photo_url" [size]="72" [decorative]="false" />
                  @if (f.photo_url) {
                    <button appButton variant="ghost" type="button" (click)="removing.set('farmer-photo')">Remover foto</button>
                  } @else {
                    <span class="t-body-sm muted">Sem foto de perfil.</span>
                  }
                </div>
                @if (editing() === 'farmer') {
                  <form class="form" [formGroup]="farmerForm" (ngSubmit)="saveFarmer(f)" novalidate>
                    <app-form-field label="Nome completo" fieldId="farmer-name" [control]="farmerForm.controls.name">
                      <input formControlName="name" autocomplete="off">
                    </app-form-field>
                    <app-form-field label="E-mail" fieldId="farmer-email" hint="É o e-mail da conta: muda também no outro perfil." [control]="farmerForm.controls.email">
                      <input type="email" formControlName="email" autocomplete="off">
                    </app-form-field>
                    <app-form-field label="Telefone (WhatsApp)" fieldId="farmer-phone" [control]="farmerForm.controls.phone" [messages]="phoneMessages">
                      <input appMask="phone" formControlName="phone" inputmode="numeric" autocomplete="off">
                    </app-form-field>
                    <div class="form-actions">
                      <button appButton variant="secondary" type="button" [disabled]="saving()" (click)="editing.set(null)">Cancelar</button>
                      <button appButton type="submit" [loading]="saving()">Salvar alterações</button>
                    </div>
                  </form>
                } @else {
                  <dl class="details">
                    <div><dt>Nome</dt><dd>{{ f.name }}</dd></div>
                    <div><dt>Telefone</dt><dd>{{ phone(f.phone) }}</dd></div>
                    <div><dt>CPF</dt><dd>{{ cpf(f.cpf) }}</dd></div>
                    <div><dt>Fazendas ativas</dt><dd>{{ f.farms.length }}</dd></div>
                    <div><dt>Cadastro</dt><dd>{{ date(f.insertion_date) }}</dd></div>
                  </dl>
                  <div class="cluster">
                    <button appButton variant="secondary" type="button" [disabled]="editing() !== null" (click)="editFarmer(f)">Editar</button>
                    <button appButton variant="ghost" type="button" (click)="removing.set('farmer')">Remover perfil de produtor</button>
                  </div>
                }
              </section>
            }

            @if (u.worker; as w) {
              <section class="card stack">
                <h2 class="t-h3">Perfil de trabalhador</h2>
                <div class="photo">
                  <app-avatar [name]="w.name" [photoUrl]="w.photo_url" [size]="72" [decorative]="false" />
                  @if (w.photo_url) {
                    <button appButton variant="ghost" type="button" (click)="removing.set('worker-photo')">Remover foto</button>
                  } @else {
                    <span class="t-body-sm muted">Sem foto de perfil.</span>
                  }
                </div>
                @if (editing() === 'worker') {
                  <form class="form" [formGroup]="workerForm" (ngSubmit)="saveWorker(w)" novalidate>
                    <app-form-field label="Nome completo" fieldId="worker-name" [control]="workerForm.controls.name">
                      <input formControlName="name" autocomplete="off">
                    </app-form-field>
                    <app-form-field label="E-mail" fieldId="worker-email" hint="É o e-mail da conta: muda também no outro perfil." [control]="workerForm.controls.email">
                      <input type="email" formControlName="email" autocomplete="off">
                    </app-form-field>
                    <app-form-field label="Telefone (WhatsApp)" fieldId="worker-phone" [control]="workerForm.controls.phone" [messages]="phoneMessages">
                      <input appMask="phone" formControlName="phone" inputmode="numeric" autocomplete="off">
                    </app-form-field>
                    <app-form-field label="Apresentação" fieldId="worker-bio" [control]="workerForm.controls.bio">
                      <textarea formControlName="bio" rows="3" [attr.maxlength]="maxBio"></textarea>
                    </app-form-field>
                    <app-form-field label="Experiência" fieldId="worker-experience" [control]="workerForm.controls.experience">
                      <textarea formControlName="experience" rows="2" [attr.maxlength]="maxLongText"></textarea>
                    </app-form-field>
                    <app-form-field label="Certificados" fieldId="worker-certificates" [control]="workerForm.controls.certificates">
                      <textarea formControlName="certificates" rows="2" [attr.maxlength]="maxLongText"></textarea>
                    </app-form-field>
                    <app-form-field label="Cursos" fieldId="worker-courses" [control]="workerForm.controls.courses">
                      <textarea formControlName="courses" rows="2" [attr.maxlength]="maxLongText"></textarea>
                    </app-form-field>
                    <div class="form-actions">
                      <button appButton variant="secondary" type="button" [disabled]="saving()" (click)="editing.set(null)">Cancelar</button>
                      <button appButton type="submit" [loading]="saving()">Salvar alterações</button>
                    </div>
                  </form>
                } @else {
                  <dl class="details">
                    <div><dt>Nome</dt><dd>{{ w.name }}</dd></div>
                    <div><dt>Telefone</dt><dd>{{ phone(w.phone) }}</dd></div>
                    <div><dt>CPF</dt><dd>{{ cpf(w.cpf) }}</dd></div>
                    <div><dt>Cadastro</dt><dd>{{ date(w.insertion_date) }}</dd></div>
                    <div><dt>Apresentação</dt><dd>{{ w.bio || '—' }}</dd></div>
                    <div><dt>Experiência</dt><dd>{{ w.experience || '—' }}</dd></div>
                    <div><dt>Certificados</dt><dd>{{ w.certificates || '—' }}</dd></div>
                    <div><dt>Cursos</dt><dd>{{ w.courses || '—' }}</dd></div>
                  </dl>
                  <div class="cluster">
                    <button appButton variant="secondary" type="button" [disabled]="editing() !== null" (click)="editWorker(w)">Editar</button>
                    <button appButton variant="ghost" type="button" (click)="removing.set('worker')">Remover perfil de trabalhador</button>
                  </div>
                }
              </section>
            }

            <div class="cluster">
              <button appButton variant="danger" type="button" (click)="removing.set('account')">Remover conta</button>
            </div>
          }
        }
      }
    </div>

    <app-confirm-dialog
      [open]="removing() !== null"
      [title]="removalText().title"
      [message]="removalText().message + ' Essa ação não pode ser desfeita.'"
      [confirmLabel]="removalText().confirm"
      confirmVariant="danger"
      [loading]="deleting()"
      (confirmed)="remove()"
      (cancelled)="removing.set(null)"
    />
  `,
  styles: `
    .who { display: flex; align-items: center; gap: var(--space-4); }
    .photo { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-3); }
    dd { white-space: pre-line; }
  `
})
export class AdminUserDetailPage implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly admin = inject(AdminService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  readonly id = input.required<string>(); // parâmetro :id da rota (account_id)
  private readonly accountId = computed(() => Number(this.id()));

  readonly user = new RemoteData(() => this.admin.getUser(this.accountId()));

  readonly editing = signal<'farmer' | 'worker' | null>(null);
  readonly saving = signal(false);
  readonly removing = signal<Removal | null>(null);
  readonly deleting = signal(false);
  readonly removalText = computed(() => REMOVAL_TEXT[this.removing() ?? 'account']);

  readonly farmerForm = this.fb.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required, Validators.minLength(10)]]
  });

  readonly workerForm = this.fb.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required, Validators.minLength(10)]],
    bio: ['', Validators.maxLength(MAX_BIO)],
    experience: ['', Validators.maxLength(MAX_LONG_TEXT)],
    certificates: ['', Validators.maxLength(MAX_LONG_TEXT)],
    courses: ['', Validators.maxLength(MAX_LONG_TEXT)]
  });

  readonly phoneMessages = { minlength: 'Digite o telefone com DDD, só números.' };
  readonly maxBio = MAX_BIO;
  readonly maxLongText = MAX_LONG_TEXT;
  readonly name = accountName;
  readonly phone = formatPhone;
  readonly cpf = formatCpf;
  readonly date = formatDate;

  // O :id da rota só está disponível depois que os inputs são ligados.
  ngOnInit(): void {
    this.user.load();
  }

  editFarmer(farmer: Farmer): void {
    this.farmerForm.reset({ name: farmer.name, email: farmer.email, phone: farmer.phone });
    this.editing.set('farmer');
  }

  editWorker(worker: Worker): void {
    this.workerForm.reset({
      name: worker.name,
      email: worker.email,
      phone: worker.phone,
      bio: worker.bio ?? '',
      experience: worker.experience ?? '',
      certificates: worker.certificates ?? '',
      courses: worker.courses ?? ''
    });
    this.editing.set('worker');
  }

  saveFarmer(farmer: Farmer): void {
    this.farmerForm.markAllAsTouched();
    if (this.farmerForm.invalid) return;

    const { name, email, phone } = this.farmerForm.getRawValue();
    this.saving.set(true);
    this.admin.updateFarmer(farmer.id, { name: name.trim(), email: email.trim(), phone }).subscribe({
      next: () => this.saved(),
      error: () => this.saving.set(false) // a mensagem já saiu no toast
    });
  }

  saveWorker(worker: Worker): void {
    this.workerForm.markAllAsTouched();
    if (this.workerForm.invalid) return;

    const { name, email, phone, bio, experience, certificates, courses } = this.workerForm.getRawValue();
    const optional = (text: string): string | null => text.trim() || null;
    const changes = {
      name: name.trim(),
      email: email.trim(),
      phone,
      bio: optional(bio),
      experience: optional(experience),
      certificates: optional(certificates),
      courses: optional(courses)
    };
    this.saving.set(true);
    this.admin.updateWorker(worker.id, changes).subscribe({
      next: () => this.saved(),
      error: () => this.saving.set(false)
    });
  }

  remove(): void {
    const target = this.removing();
    const u = this.user.data();
    if (!target || !u) return;
    if (target === 'farmer-photo' || target === 'worker-photo') {
      this.removePhoto(u, target);
      return;
    }

    const request =
      target === 'account'
        ? this.admin.deleteUser(u.account_id)
        : target === 'farmer'
          ? this.admin.deleteFarmer(u.farmer?.id ?? 0)
          : this.admin.deleteWorker(u.worker?.id ?? 0);

    this.deleting.set(true);
    request.subscribe({
      next: () => {
        this.deleting.set(false);
        this.removing.set(null);
        this.editing.set(null);
        // Sem o outro perfil, a conta some junto.
        const accountGone = target === 'account' || !this.hasOther(u, target);
        this.toast.success(accountGone ? 'Conta removida.' : 'Perfil removido. A conta continua com o outro perfil.');
        if (accountGone) {
          void this.router.navigateByUrl('/sistema/usuarios');
        } else {
          this.user.refresh();
        }
      },
      error: () => this.deleting.set(false)
    });
  }

  // Só a foto: a conta e os perfis continuam.
  private removePhoto(user: AdminUser, target: 'farmer-photo' | 'worker-photo'): void {
    const request: Observable<unknown> =
      target === 'farmer-photo' ? this.admin.deleteFarmerPhoto(user.farmer?.id ?? 0) : this.admin.deleteWorkerPhoto(user.worker?.id ?? 0);

    this.deleting.set(true);
    request.subscribe({
      next: () => {
        this.deleting.set(false);
        this.removing.set(null);
        this.toast.success('Foto removida.');
        this.user.refresh();
      },
      error: () => this.deleting.set(false)
    });
  }

  private hasOther(user: AdminUser, removed: 'farmer' | 'worker'): boolean {
    return removed === 'farmer' ? user.worker !== null : user.farmer !== null;
  }

  private saved(): void {
    this.saving.set(false);
    this.editing.set(null);
    this.toast.success('Dados atualizados.');
    this.user.refresh();
  }
}
