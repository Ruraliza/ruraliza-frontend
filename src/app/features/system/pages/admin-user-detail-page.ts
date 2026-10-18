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
  templateUrl: './admin-user-detail-page.html',
  styleUrl: './admin-user-detail-page.css'
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
