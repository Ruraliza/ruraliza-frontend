import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Observable, map } from 'rxjs';
import { SessionUser } from '@core/models/auth.model';
import { ProfileService } from '@core/api/profile.service';
import { CurrentUserService, UserRole } from '@core/session/current-user.service';
import { ROLE_HOME, roleFromSlug } from '@core/session/roles';
import { ToastService } from '@core/toast/toast.service';
import { cpfValidator } from '@shared/utils/cpf';
import { noBlockedTerms } from '@shared/utils/moderation';
import { Button } from '@shared/ui/button';
import { FormField } from '@shared/ui/form-field';
import { Icon } from '@shared/ui/icon';
import { MaskedInput } from '@shared/ui/masked-input';
import { PasswordReveal } from '@shared/ui/password-reveal';
import { CONFIRMATION_MESSAGES, PASSWORD_HINT, PASSWORD_MESSAGES, matchesField, passwordValidators, revalidateWith } from '@shared/utils/password';
import { ACCEPTED_RESUME, RESUME_MESSAGES, resumeValidator } from '@shared/domain/utils/resume';
import { draftParams, hasDraft } from '@shared/domain/utils/service-draft';

export interface RoleChoice {
  value: UserRole;
  title: string;
  description: string;
  icon: 'farm' | 'briefcase';
}

export const ROLE_CHOICES: RoleChoice[] = [
  { value: 'farmer', title: 'Sou produtor', description: 'Publico serviços na minha fazenda e escolho quem vai executar.', icon: 'farm' },
  { value: 'worker', title: 'Sou trabalhador', description: 'Procuro vagas no campo e me candidato aos serviços.', icon: 'briefcase' }
];

// Cadastro único: a conta começa com o perfil escolhido nas alternativas (produtor ou trabalhador).
// O outro perfil pode ser criado depois, pelo menu, na mesma conta.
// `?papel=produtor|trabalhador` já deixa uma alternativa marcada. Sucesso já define o usuário atual e leva ao painel.
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

    /* Alternativas do tipo de conta: cartões com rádio. */
    .choices { display: grid; gap: var(--space-3); grid-template-columns: repeat(auto-fit, minmax(min(100%, 240px), 1fr)); margin: 0; padding: 0; border: 0; }
    .choices legend { margin-bottom: var(--space-2); font-weight: 600; }
    .choice {
      display: grid; grid-template-columns: auto 1fr; gap: var(--space-1) var(--space-3); align-items: start; padding: var(--space-4);
      border-radius: var(--radius-md); border: 2px solid var(--line); background: var(--surface-raised); cursor: pointer;
    }
    .choice:hover { border-color: var(--mata); }
    .choice:has(input:checked) { border-color: var(--mata); background: var(--broto-soft); }
    .choice:has(input:focus-visible) { box-shadow: var(--focus-ring); }
    .choice .icon { grid-row: span 2; display: grid; place-items: center; width: 48px; height: 48px; border-radius: var(--radius-md); background: var(--broto-soft); }
    .choice-error { color: var(--danger); font-weight: 600; }
    .terms { display: grid; gap: var(--space-2); }
    .check { display: grid; grid-template-columns: auto 1fr; gap: var(--space-3); align-items: start; cursor: pointer; line-height: 1.5rem; }
    .check input { width: 22px; height: 22px; margin: 1px 0 0; }
    .check a { font-weight: 600; }
  `
})
export class SignupPage implements OnInit {
  readonly papel = input<string>();
  // Rascunho de vaga vindo da landing ("Monte uma vaga"), via query params.
  readonly servico = input<string>();
  readonly categoria = input<string>();
  readonly duracao = input<string>();
  readonly valor = input<string>();

  private readonly fb = inject(NonNullableFormBuilder);
  private readonly profiles = inject(ProfileService);
  private readonly currentUser = inject(CurrentUserService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  readonly choices = ROLE_CHOICES;
  readonly saving = signal(false);
  readonly draft = computed(() => ({ servico: this.servico(), categoria: this.categoria(), duracao: this.duracao(), valor: this.valor() }));

  readonly form = this.fb.group({
    role: this.fb.control<UserRole | null>(null, Validators.required),
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required, Validators.minLength(10)]],
    cpf: ['', [Validators.required, cpfValidator]],
    password: ['', passwordValidators],
    confirmation: ['', [Validators.required, matchesField('password')]],
    experience: ['', noBlockedTerms],
    certificates: ['', noBlockedTerms],
    resume: this.fb.control<File | null>(null, resumeValidator), // só trabalhador; enviado depois do cadastro
    acceptTerms: [false, Validators.requiredTrue] // Termos de Uso e Política de Privacidade (a API guarda a data do aceite)
  });

  readonly role = toSignal(this.form.controls.role.valueChanges, { initialValue: null });
  readonly hasDraft = computed(() => this.role() === 'farmer' && hasDraft(this.draft()));

  readonly phoneMessages = { minlength: 'Digite o telefone com DDD, só números.' };
  readonly passwordHint = PASSWORD_HINT;
  readonly passwordMessages = PASSWORD_MESSAGES;
  readonly confirmationMessages = CONFIRMATION_MESSAGES;
  readonly resumeMessages = RESUME_MESSAGES;
  readonly acceptedResume = ACCEPTED_RESUME;

  constructor() {
    revalidateWith(this.form.controls.password, this.form.controls.confirmation);
  }

  ngOnInit(): void {
    // Alternativa já marcada pelo link de origem (landing: "Quero trabalhar", "Monte uma vaga"...).
    const preset = roleFromSlug(this.papel());
    if (preset) this.form.controls.role.setValue(preset);
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

    const role = this.form.controls.role.value;
    if (!role) return;

    this.saving.set(true);
    this.create(role).subscribe({
      next: ({ user, token }) => {
        this.currentUser.signIn(user, token);
        const resume = role === 'worker' ? this.form.controls.resume.value : null;
        if (resume) {
          this.sendResume(user.id, resume);
          return;
        }
        this.toast.success('Cadastro concluído. Boas-vindas ao Ruraliza!');
        if (this.hasDraft()) {
          void this.router.navigate(['/produtor/servicos/novo'], { queryParams: draftParams(this.draft()) });
        } else {
          void this.router.navigateByUrl(ROLE_HOME[role]);
        }
      },
      error: () => this.saving.set(false) // a mensagem já saiu no toast
    });
  }

  // Currículo escolhido no cadastro: sobe agora que o trabalhador existe.
  private sendResume(workerId: number, resume: File): void {
    this.profiles.uploadResume(workerId, resume).subscribe({
      next: () => {
        this.toast.success('Cadastro concluído com o currículo. Boas-vindas ao Ruraliza!');
        void this.router.navigateByUrl(ROLE_HOME.worker);
      },
      error: () => {
        // A conta já existe: leva ao perfil, onde dá para reenviar o currículo.
        this.toast.info('Conta criada, mas o currículo não foi enviado. Tente de novo aqui no seu perfil.');
        void this.router.navigateByUrl('/trabalhador/perfil');
      }
    });
  }

  // A resposta do cadastro já traz a sessão (e o token) da conta nova.
  private create(role: UserRole): Observable<{ user: SessionUser; token: string }> {
    const { name, email, phone, cpf, password, experience, certificates } = this.form.getRawValue();
    const base = { name: name.trim(), email: email.trim(), phone, cpf, password, accept_terms: true };

    if (role === 'farmer') {
      return this.profiles.createFarmer(base).pipe(map(({ user, token }) => ({ user, token })));
    }
    return this.profiles
      .createWorker({ ...base, experience: experience.trim() || null, certificates: certificates.trim() || null })
      .pipe(map(({ user, token }) => ({ user, token })));
  }
}
