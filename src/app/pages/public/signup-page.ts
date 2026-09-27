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
import { MaskedInput } from '../../shared/ui/masked-input';
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
  imports: [ReactiveFormsModule, RouterLink, Button, FormField, MaskedInput],
  templateUrl: './signup-page.html',
  styles: `.draft-note { max-width: 560px; padding: var(--space-4); border-radius: var(--radius-md); background: var(--lime-100); }`
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
    experience: [''],
    certificates: ['']
  });

  readonly phoneMessages = { minlength: 'Digite o telefone com DDD, só números.' };

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    this.saving.set(true);
    this.create().subscribe({
      next: (id) => {
        this.currentUser.set({ role: this.role(), id });
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

  private create(): Observable<number> {
    const { name, email, phone, cpf, experience, certificates } = this.form.getRawValue();
    const base = { name: name.trim(), email: email.trim(), phone, cpf };

    if (this.role() === 'farmer') {
      return this.farmerService.createFarmer(base).pipe(map((res) => res.farmer.id));
    }
    return this.workerService
      .createWorker({ ...base, experience: experience.trim() || null, certificates: certificates.trim() || null })
      .pipe(map((res) => res.worker.id));
  }
}
