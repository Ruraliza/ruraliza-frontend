import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { AccountService } from '@core/api/account.service';
import { ProfileService } from '@core/api/profile.service';
import { CurrentUserService, UserRole } from '@core/session/current-user.service';
import { ROLE_HOME, ROLE_LABEL, otherRole, roleFromSlug } from '@core/session/roles';
import { ToastService } from '@core/toast/toast.service';
import { ProfileCreateInput } from '@core/models/auth.model';
import { cpfValidator } from '@shared/utils/cpf';
import { formatCpf, formatPhone } from '@shared/utils/format';
import { noBlockedTerms } from '@shared/utils/moderation';
import { ACCEPTED_RESUME, RESUME_MESSAGES, resumeValidator } from '@shared/domain/utils/resume';
import { Button } from '@shared/ui/button';
import { FormField } from '@shared/ui/form-field';
import { Icon } from '@shared/ui/icon';
import { MaskedInput } from '@shared/ui/masked-input';

interface ProfileData {
  name: string;
  phone: string;
  cpf: string;
}

// Produtor que também quer ser trabalhador (ou o contrário): completa o cadastro do outro perfil
// na mesma conta. Duas etapas: os dados (já preenchidos com os do perfil atual) e uma confirmação,
// que sempre aparece antes de criar o novo cadastro.
@Component({
  selector: 'app-new-profile-page',
  imports: [ReactiveFormsModule, RouterLink, Button, FormField, Icon, MaskedInput],
  template: `
    <div class="container page">
      @if (target(); as role) {
        <a class="back-link" [routerLink]="homeUrl()">← Voltar para a área do {{ label(origin()) }}</a>

        @if (step() === 'form') {
          <div class="page-header">
            <div>
              <h1>Quero ser {{ label(role) }}</h1>
              <p class="muted">
                Confira os dados do seu perfil de {{ label(role) }}. Eles vêm do seu perfil de {{ label(origin()) }} e podem ser ajustados.
                O e-mail e a senha continuam os mesmos.
              </p>
            </div>
          </div>

          <form class="form card" [formGroup]="form" (ngSubmit)="review()" novalidate>
            <div class="t-body-sm">
              <span class="t-label">E-mail da conta</span>
              <p><b>{{ email() }}</b></p>
            </div>

            <app-form-field label="Nome completo" fieldId="name" [control]="form.controls.name">
              <input formControlName="name" autocomplete="name">
            </app-form-field>

            <app-form-field label="Telefone (WhatsApp)" fieldId="phone" [control]="form.controls.phone" [messages]="phoneMessages">
              <input appMask="phone" formControlName="phone" inputmode="numeric" autocomplete="tel" placeholder="(24) 99999-8888">
            </app-form-field>

            <app-form-field label="CPF" fieldId="cpf" hint="O mesmo do seu outro perfil." [control]="form.controls.cpf">
              <input appMask="cpf" formControlName="cpf" inputmode="numeric" placeholder="000.000.000-00">
            </app-form-field>

            @if (role === 'worker') {
              <app-form-field label="Experiência" fieldId="experience" [optional]="true" hint="Ex.: 5 anos em colheita de café." [control]="form.controls.experience">
                <input formControlName="experience">
              </app-form-field>

              <app-form-field label="Certificados" fieldId="certificates" [optional]="true" hint="Ex.: NR-31, curso de tratorista." [control]="form.controls.certificates">
                <input formControlName="certificates">
              </app-form-field>

              <app-form-field label="Currículo" fieldId="resume" [optional]="true" hint="Arquivo PDF de até 5 MB. Dá para enviar ou trocar depois, no seu perfil."
                [control]="form.controls.resume" [messages]="resumeMessages">
                <div class="cluster">
                  <label class="pick">
                    <input #resumeInput type="file" class="visually-hidden" [accept]="acceptedResume" (change)="pickResume(resumeInput)">
                    <app-icon name="plus" [size]="18" />{{ form.controls.resume.value ? 'Trocar currículo' : 'Escolher currículo' }}
                  </label>
                  @if (form.controls.resume.value; as file) {
                    <span class="file-name t-body-sm">{{ file.name }}</span>
                    <button appButton variant="ghost" type="button" (click)="clearResume(resumeInput)">Remover</button>
                  }
                </div>
              </app-form-field>
            }

            <div class="form-actions">
              <button appButton type="submit">Continuar</button>
              <a appButton variant="ghost" [routerLink]="homeUrl()">Cancelar</a>
            </div>
          </form>
        } @else {
          <div class="page-header">
            <div>
              <h1>Confirmar novo cadastro</h1>
            </div>
          </div>

          <section class="form card" aria-labelledby="confirm-title">
            <div class="notice">
              <app-icon name="alert" [size]="24" />
              <div>
                <h2 id="confirm-title" class="t-h3">Será feito um novo cadastro de {{ label(role) }}</h2>
                <p>
                  Você está criando um perfil de {{ label(role) }} na sua conta <b>{{ email() }}</b>.
                  Seu perfil de {{ label(origin()) }} continua como está, e você poderá alternar entre as duas áreas pelo menu.
                </p>
              </div>
            </div>

            <dl class="summary">
              <dt>Nome</dt><dd>{{ form.controls.name.value }}</dd>
              <dt>E-mail</dt><dd>{{ email() }}</dd>
              <dt>Telefone</dt><dd>{{ phoneText() }}</dd>
              <dt>CPF</dt><dd>{{ cpfText() }}</dd>
              @if (role === 'worker') {
                <dt>Experiência</dt><dd>{{ form.controls.experience.value || '—' }}</dd>
                <dt>Certificados</dt><dd>{{ form.controls.certificates.value || '—' }}</dd>
                <dt>Currículo</dt><dd>{{ form.controls.resume.value?.name ?? '—' }}</dd>
              }
            </dl>

            <div class="form-actions">
              <button appButton type="button" [loading]="saving()" (click)="confirm(role)">Confirmar e criar cadastro</button>
              <button appButton variant="ghost" type="button" [disabled]="saving()" (click)="step.set('form')">Voltar</button>
            </div>
          </section>
        }
      }
    </div>
  `,
  styles: `
    .pick {
      display: inline-flex; align-items: center; gap: var(--space-2); min-height: 48px; padding: 0 var(--space-6);
      border: 1px solid var(--line-strong); border-radius: var(--radius-pill); background: var(--surface-raised);
      color: var(--ink); font-weight: 600; cursor: pointer;
    }
    .pick:hover { background: var(--surface-sunken); }
    .pick:focus-within { box-shadow: var(--focus-ring); }
    .file-name { overflow-wrap: anywhere; }

    .notice { display: flex; gap: var(--space-3); align-items: flex-start; padding: var(--space-4); border-radius: var(--radius-md); background: var(--broto-soft); }
    .notice app-icon { flex: none; }
    .notice h2 { margin: 0 0 var(--space-1); }
    .notice p { margin: 0; }
    .summary { display: grid; grid-template-columns: max-content 1fr; gap: var(--space-2) var(--space-4); margin: 0; }
    .summary dt { color: var(--ink-muted); font-weight: 600; }
    .summary dd { margin: 0; overflow-wrap: anywhere; }
  `
})
export class NewProfilePage implements OnInit {
  // Trecho da URL: /conta/novo-perfil/produtor ou /conta/novo-perfil/trabalhador.
  readonly papel = input.required<string>();

  private readonly fb = inject(NonNullableFormBuilder);
  private readonly accounts = inject(AccountService);
  private readonly profiles = inject(ProfileService);
  private readonly currentUser = inject(CurrentUserService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  readonly target = computed(() => roleFromSlug(this.papel()));
  readonly origin = computed(() => otherRole(this.target() ?? 'farmer'));
  readonly homeUrl = computed(() => ROLE_HOME[this.origin()]);
  readonly email = signal('');
  readonly step = signal<'form' | 'confirm'>('form');
  readonly saving = signal(false);

  readonly form = this.fb.group({
    name: ['', Validators.required],
    phone: ['', [Validators.required, Validators.minLength(10)]],
    cpf: ['', [Validators.required, cpfValidator]],
    experience: ['', noBlockedTerms],
    certificates: ['', noBlockedTerms],
    resume: this.fb.control<File | null>(null, resumeValidator) // só trabalhador; enviado depois do cadastro
  });

  readonly phoneMessages = { minlength: 'Digite o telefone com DDD, só números.' };
  readonly resumeMessages = RESUME_MESSAGES;
  readonly acceptedResume = ACCEPTED_RESUME;

  label(role: UserRole): string {
    return ROLE_LABEL[role];
  }

  phoneText(): string {
    return formatPhone(this.form.controls.phone.value);
  }

  cpfText(): string {
    return formatCpf(this.form.controls.cpf.value);
  }

  ngOnInit(): void {
    const target = this.target();
    const user = this.currentUser.user();
    if (!target || !user) {
      this.router.navigateByUrl('/', { replaceUrl: true });
      return;
    }
    // A conta já tem esse perfil: não há o que criar, abre o painel dele.
    if (this.currentUser.hasProfile(target)) {
      this.router.navigateByUrl(ROLE_HOME[target], { replaceUrl: true });
      return;
    }
    this.prefill(user.role, user.id);
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

  // Etapa 1 → 2: confere os dados e mostra a confirmação.
  review(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    this.step.set('confirm');
    window.scrollTo({ top: 0 });
  }

  confirm(role: UserRole): void {
    const user = this.currentUser.user();
    if (!user || this.saving()) return;

    this.saving.set(true);
    this.accounts.createProfile(user.account_id, this.input(role)).subscribe({
      next: ({ user: session }) => {
        this.currentUser.set(session);
        const resume = role === 'worker' ? this.form.controls.resume.value : null;
        if (resume) {
          this.sendResume(session.id, resume);
          return;
        }
        this.toast.success(`Perfil de ${ROLE_LABEL[role]} criado. Você já está na nova área.`);
        this.router.navigateByUrl(ROLE_HOME[role], { replaceUrl: true });
      },
      error: () => this.saving.set(false) // a mensagem já saiu no toast
    });
  }

  // Dados do perfil atual como ponto de partida.
  private prefill(role: UserRole, id: number): void {
    const source: Observable<ProfileData & { email: string }> =
      role === 'farmer' ? this.profiles.getFarmer(id) : this.profiles.getWorker(id);
    source.subscribe({
      next: (profile) => {
        this.email.set(profile.email);
        this.form.patchValue({ name: profile.name, phone: profile.phone, cpf: profile.cpf });
      },
      error: () => undefined // sem os dados, a pessoa preenche (a mensagem já saiu no toast)
    });
  }

  private input(role: UserRole): ProfileCreateInput {
    const { name, phone, cpf, experience, certificates } = this.form.getRawValue();
    const base: ProfileCreateInput = { role, name: name.trim(), phone, cpf };
    if (role === 'farmer') return base;
    return { ...base, experience: experience.trim() || null, certificates: certificates.trim() || null };
  }

  // Currículo escolhido aqui: sobe agora que o perfil de trabalhador existe.
  private sendResume(workerId: number, resume: File): void {
    this.profiles.uploadResume(workerId, resume).subscribe({
      next: () => {
        this.toast.success('Perfil de trabalhador criado com o currículo. Você já está na nova área.');
        this.router.navigateByUrl(ROLE_HOME.worker, { replaceUrl: true });
      },
      error: () => {
        // O perfil já existe: leva ao perfil, onde dá para reenviar o currículo.
        this.toast.info('Perfil criado, mas o currículo não foi enviado. Tente de novo aqui no seu perfil.');
        this.router.navigateByUrl('/trabalhador/perfil', { replaceUrl: true });
      }
    });
  }
}
