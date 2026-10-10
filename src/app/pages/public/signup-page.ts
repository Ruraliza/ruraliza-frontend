import { Component, computed, inject, input, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Observable, map } from 'rxjs';
import { FarmerService } from '../../core/api/farmer.service';
import { WorkerService } from '../../core/api/worker.service';
import { CurrentUserService, UserRole } from '../../core/session/current-user.service';
import { ToastService } from '../../core/toast/toast.service';
import { cpfValidator } from '../../shared/utils/cpf';
import { Button } from '../../shared/ui/button';
import { FormField } from '../../shared/ui/form-field';
import { Icon } from '../../shared/ui/icon';
import { MaskedInput } from '../../shared/ui/masked-input';
import { PasswordReveal } from '../../shared/ui/password-reveal';
import { CONFIRMATION_MESSAGES, PASSWORD_HINT, PASSWORD_MESSAGES, matchesField, passwordValidators, revalidateWith } from '../../shared/utils/password';
import { ACCEPTED_RESUME, RESUME_MESSAGES, resumeValidator } from '../../shared/utils/resume';
import { draftParams, hasDraft } from '../../shared/utils/service-draft';

const COPY: Record<UserRole, { title: string; intro: string; home: string }> = {
  farmer: {
    title: 'Cadastro de produtor',
    intro: 'Com seu perfil você publica serviços e escolhe quem vai executar.',
    home: '/produtor'
  },
  worker: {
    title: 'Cadastro de trabalhador',
    intro: 'Com seu perfil você encontra vagas no campo e se candidata.',
    home: '/trabalhador'
  }
};

// Cadastro de produtor ou trabalhador (o papel vem do `data` da rota).
// Sucesso já define o usuário atual e leva ao painel.
@Component({
  selector: 'app-signup-page',
  imports: [ReactiveFormsModule, RouterLink, Button, FormField, Icon, MaskedInput, PasswordReveal],
  templateUrl: './signup-page.html',
  styles: `
    .draft-note { max-width: 560px; padding: var(--space-4); border-radius: var(--radius-md); background: var(--lime-100); }
    /* Seletor de arquivo com cara de botão secundário (mesmo padrão do envio de foto de perfil). */
    .pick {
      display: inline-flex; align-items: center; gap: var(--space-2); min-height: 48px; padding: 0 var(--space-6);
      border: 1px solid var(--line-strong); border-radius: var(--radius-pill); background: var(--surface-raised);
      color: var(--ink); font-weight: 600; cursor: pointer;
    }
    .pick:hover { background: var(--surface-sunken); }
    .pick:focus-within { box-shadow: var(--focus-ring); }
    .file-name { overflow-wrap: anywhere; }
  `
})
export class SignupPage {
  readonly role = input.required<UserRole>();
  // Rascunho de vaga vindo da landing ("Monte uma vaga"), via query params.
  readonly servico = input<string>();
  readonly categoria = input<string>();
  readonly duracao = input<string>();
  readonly valor = input<string>();

  private readonly fb = inject(NonNullableFormBuilder);
  private readonly farmerService = inject(FarmerService);
  private readonly workerService = inject(WorkerService);
  private readonly currentUser = inject(CurrentUserService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  readonly copy = computed(() => COPY[this.role()]);
  readonly saving = signal(false);
  readonly draft = computed(() => ({ servico: this.servico(), categoria: this.categoria(), duracao: this.duracao(), valor: this.valor() }));
  readonly hasDraft = computed(() => this.role() === 'farmer' && hasDraft(this.draft()));

  readonly form = this.fb.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required, Validators.minLength(10)]],
    cpf: ['', [Validators.required, cpfValidator]],
    password: ['', passwordValidators],
    confirmation: ['', [Validators.required, matchesField('password')]],
    experience: [''],
    certificates: [''],
    resume: this.fb.control<File | null>(null, resumeValidator) // só trabalhador; enviado depois do cadastro
  });

  readonly phoneMessages = { minlength: 'Digite o telefone com DDD, só números.' };
  readonly passwordHint = PASSWORD_HINT;
  readonly passwordMessages = PASSWORD_MESSAGES;
  readonly confirmationMessages = CONFIRMATION_MESSAGES;
  readonly resumeMessages = RESUME_MESSAGES;
  readonly acceptedResume = ACCEPTED_RESUME;

  constructor() {
    revalidateWith(this.form.controls.password, this.form.controls.confirmation);
  }

  pickResume(input: HTMLInputElement): void {
    const control = this.form.controls.resume;
    control.setValue(input.files?.[0] ?? null);
    control.markAsTouched();
  }

  clearResume(input: HTMLInputElement): void {
    input.value = '';
    this.form.controls.resume.setValue(null);
  }

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    this.saving.set(true);
    this.create().subscribe({
      next: (id) => {
        this.currentUser.set({ role: this.role(), id });
        const resume = this.role() === 'worker' ? this.form.controls.resume.value : null;
        if (resume) {
          this.sendResume(id, resume);
          return;
        }
        this.toast.success('Cadastro concluído. Boas-vindas ao Ruraliza!');
        if (this.hasDraft()) {
          this.router.navigate(['/produtor/servicos/novo'], { queryParams: draftParams(this.draft()) });
        } else {
          this.router.navigateByUrl(this.copy().home);
        }
      },
      error: () => this.saving.set(false) // a mensagem já saiu no toast
    });
  }

  // Currículo escolhido no cadastro: sobe agora que o trabalhador existe.
  private sendResume(workerId: number, resume: File): void {
    this.workerService.uploadResume(workerId, resume).subscribe({
      next: () => {
        this.toast.success('Cadastro concluído com o currículo. Boas-vindas ao Ruraliza!');
        this.router.navigateByUrl(this.copy().home);
      },
      error: () => {
        // A conta já existe: leva ao perfil, onde dá para reenviar o currículo.
        this.toast.info('Conta criada, mas o currículo não foi enviado. Tente de novo aqui no seu perfil.');
        this.router.navigateByUrl('/trabalhador/perfil');
      }
    });
  }

  private create(): Observable<number> {
    const { name, email, phone, cpf, password, experience, certificates } = this.form.getRawValue();
    const base = { name: name.trim(), email: email.trim(), phone, cpf, password };

    if (this.role() === 'farmer') {
      return this.farmerService.createFarmer(base).pipe(map((res) => res.farmer.id));
    }
    return this.workerService
      .createWorker({ ...base, experience: experience.trim() || null, certificates: certificates.trim() || null })
      .pipe(map((res) => res.worker.id));
  }
}
