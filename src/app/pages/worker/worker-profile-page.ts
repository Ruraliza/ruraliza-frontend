import { Component, computed, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { WorkerService } from '../../core/api/worker.service';
import { CurrentUserService } from '../../core/session/current-user.service';
import { ToastService } from '../../core/toast/toast.service';
import { PasswordChangeInput } from '../../../models/auth.model';
import { Worker } from '../../../models/worker.model';
import { RemoteData } from '../../shared/utils/remote-data';
import { formatCpf, formatDate, formatPhone } from '../../shared/utils/format';
import { ACCEPTED_RESUME, RESUME_MESSAGES, resumeErrors } from '../../shared/utils/resume';
import { AvatarEditor } from '../../shared/ui/avatar-editor';
import { Button } from '../../shared/ui/button';
import { ConfirmDialog } from '../../shared/ui/confirm-dialog';
import { ErrorState } from '../../shared/ui/error-state';
import { FormField } from '../../shared/ui/form-field';
import { Icon } from '../../shared/ui/icon';
import { MaskedInput } from '../../shared/ui/masked-input';
import { PasswordChange } from '../../shared/ui/password-change';
import { ResumeDialog } from '../../shared/ui/resume-dialog';
import { Skeleton } from '../../shared/ui/skeleton';

// Limites iguais aos da API.
const MAX_BIO = 500;
const MAX_TEXT = 1000;

// Perfil do trabalhador: foto, currículo, apresentação, contato e qualificação; edição (id e cpf fixos) e remoção.
@Component({
  selector: 'app-worker-profile-page',
  imports: [ReactiveFormsModule, AvatarEditor, Button, ConfirmDialog, ErrorState, FormField, Icon, MaskedInput, PasswordChange, ResumeDialog, Skeleton],
  templateUrl: './worker-profile-page.html',
  styleUrl: './worker-profile-page.css'
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
  readonly photoBusy = signal(false);
  readonly resumeBusy = signal(false);
  readonly viewingResume = signal(false);
  readonly confirmingDelete = signal(false);
  readonly deleting = signal(false);

  readonly maxBio = MAX_BIO;
  readonly maxText = MAX_TEXT;

  readonly form = this.fb.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required, Validators.minLength(10)]],
    bio: ['', Validators.maxLength(MAX_BIO)],
    experience: ['', Validators.maxLength(MAX_TEXT)],
    certificates: ['', Validators.maxLength(MAX_TEXT)],
    courses: ['', Validators.maxLength(MAX_TEXT)]
  });

  readonly phoneMessages = { minlength: 'Digite o telefone com DDD, só números.' };
  readonly lengthMessages = { maxlength: 'Texto maior que o permitido.' };

  // O que ainda falta no perfil (o produtor decide olhando essas informações).
  readonly missing = computed(() => {
    const w = this.worker.data();
    if (!w) return [];
    return [
      !w.photo_url && 'foto',
      !w.bio && 'apresentação',
      !w.experience && 'experiência',
      !w.certificates && !w.courses && 'certificados ou cursos',
      !w.resume_url && 'currículo'
    ].filter((item): item is string => !!item);
  });

  readonly changePassword = (input: PasswordChangeInput) => this.workerService.changePassword(this.workerId, input);

  readonly phone = formatPhone;
  readonly cpf = formatCpf;
  readonly date = formatDate;
  readonly acceptedResume = ACCEPTED_RESUME;

  constructor() {
    this.worker.load();
  }

  startEdit(worker: Worker): void {
    this.form.reset({
      name: worker.name,
      email: worker.email,
      phone: worker.phone,
      bio: worker.bio ?? '',
      experience: worker.experience ?? '',
      certificates: worker.certificates ?? '',
      courses: worker.courses ?? ''
    });
    this.editing.set(true);
  }

  save(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    const v = this.form.getRawValue();
    const optional = (text: string): string | null => text.trim() || null;
    this.saving.set(true);
    this.workerService
      .updateWorker(this.workerId, {
        name: v.name.trim(),
        email: v.email.trim(),
        phone: v.phone,
        bio: optional(v.bio),
        experience: optional(v.experience),
        certificates: optional(v.certificates),
        courses: optional(v.courses)
      })
      .subscribe({
        next: ({ worker }) => {
          this.saving.set(false);
          this.editing.set(false);
          this.toast.success('Perfil atualizado.');
          this.worker.replace(worker);
        },
        error: () => this.saving.set(false) // a mensagem já saiu no toast
      });
  }

  uploadPhoto(photo: Blob): void {
    this.photoBusy.set(true);
    this.workerService.uploadPhoto(this.workerId, photo).subscribe({
      next: ({ worker }) => {
        this.photoBusy.set(false);
        this.toast.success('Foto de perfil atualizada.');
        this.worker.replace(worker);
      },
      error: () => this.photoBusy.set(false)
    });
  }

  removePhoto(): void {
    this.photoBusy.set(true);
    this.workerService.deletePhoto(this.workerId).subscribe({
      next: ({ worker }) => {
        this.photoBusy.set(false);
        this.toast.success('Foto removida.');
        this.worker.replace(worker);
      },
      error: () => this.photoBusy.set(false)
    });
  }

  uploadResume(input: HTMLInputElement): void {
    const file = input.files?.[0];
    input.value = ''; // permite escolher o mesmo arquivo de novo
    if (!file) return;
    const errors = resumeErrors(file);
    if (errors) {
      this.toast.error(errors['pdf'] ? RESUME_MESSAGES.pdf : RESUME_MESSAGES.maxSize);
      return;
    }
    this.resumeBusy.set(true);
    this.workerService.uploadResume(this.workerId, file).subscribe({
      next: ({ worker }) => {
        this.resumeBusy.set(false);
        this.toast.success('Currículo atualizado.');
        this.worker.replace(worker);
      },
      error: () => this.resumeBusy.set(false)
    });
  }

  removeResume(): void {
    this.resumeBusy.set(true);
    this.workerService.deleteResume(this.workerId).subscribe({
      next: ({ worker }) => {
        this.resumeBusy.set(false);
        this.toast.success('Currículo removido.');
        this.worker.replace(worker);
      },
      error: () => this.resumeBusy.set(false)
    });
  }

  remove(): void {
    this.deleting.set(true);
    this.workerService.deleteWorker(this.workerId).subscribe({
      next: () => {
        this.toast.success('Conta excluída.');
        this.signOut();
      },
      error: () => this.deleting.set(false)
    });
  }

  signOut(): void {
    this.currentUser.clear();
    this.router.navigateByUrl('/entrar');
  }
}
