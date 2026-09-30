import { Component, ElementRef, Injector, OnInit, afterNextRender, computed, effect, inject, input, signal, viewChild } from '@angular/core';
import { AbstractControl, NonNullableFormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CategoryService } from '../../core/api/category.service';
import { FarmerService } from '../../core/api/farmer.service';
import { CurrentUserService } from '../../core/session/current-user.service';
import { ToastService } from '../../core/toast/toast.service';
import { RemoteData, mergeStates } from '../../shared/utils/remote-data';
import { positiveNumberValidator } from '../../shared/utils/validators';
import { draftNumber, draftParams } from '../../shared/utils/service-draft';
import { formatDay, isExpired, todayBr } from '../../shared/utils/expiry';

const MAX_DESCRIPTION = 2000;
import { Button } from '../../shared/ui/button';
import { EmptyState } from '../../shared/ui/empty-state';
import { ErrorState } from '../../shared/ui/error-state';
import { FormField } from '../../shared/ui/form-field';
import { MaskedInput } from '../../shared/ui/masked-input';
import { Skeleton } from '../../shared/ui/skeleton';

// Novo serviço em 2 passos: o quê (nome, categoria) → onde/quanto (fazenda, horas, valor).
// Com :id na rota (/servicos/:id/editar), o mesmo formulário edita um serviço ainda Pending.
@Component({
  selector: 'app-service-form-page',
  imports: [ReactiveFormsModule, RouterLink, Button, EmptyState, ErrorState, FormField, MaskedInput, Skeleton],
  templateUrl: './service-form-page.html',
  styleUrl: './service-form-page.css'
})
export class ServiceFormPage implements OnInit {
  readonly id = input<string>(); // parâmetro :id da rota, só na edição
  // Rascunho vindo da landing ("Monte uma vaga"), via query params.
  readonly servico = input<string>();
  readonly categoria = input<string>();
  readonly duracao = input<string>();
  readonly valor = input<string>();
  readonly farmLinkParams = computed(() => ({
    voltar: 'servico',
    ...draftParams({ servico: this.servico(), categoria: this.categoria(), duracao: this.duracao(), valor: this.valor() })
  }));

  private readonly fb = inject(NonNullableFormBuilder);
  private readonly farmerService = inject(FarmerService);
  private readonly categoryService = inject(CategoryService);
  private readonly farmerId = inject(CurrentUserService).requireId('farmer');
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly injector = inject(Injector);

  readonly farms = new RemoteData(() => this.farmerService.getFarms(this.farmerId));
  readonly categories = new RemoteData(() => this.categoryService.getCategories());

  readonly serviceId = computed(() => (this.id() ? Number(this.id()) : null));
  readonly isEdit = computed(() => this.serviceId() !== null);
  readonly existing = new RemoteData(() => this.farmerService.getService(this.serviceId() as number));
  readonly loadState = computed(() =>
    this.isEdit() ? mergeStates(this.farms.state(), this.existing.state()) : this.farms.state()
  );
  readonly loadError = computed(() => this.farms.error() || this.existing.error());
  // Motivo para não permitir a edição (serviço de outro produtor ou que já saiu de Pending).
  readonly editBlocked = computed(() => {
    const service = this.existing.data();
    if (!this.isEdit() || !service) return null;
    if (service.farmer_id !== this.farmerId) return 'Este serviço é de outro produtor.';
    if (service.status !== 'Pending') return 'Só é possível editar serviços que ainda aguardam candidatos.';
    return null;
  });
  private filledFromExisting = false;
  // Validade atual do serviço em edição: só é reenviada se mudar (uma data já vencida seria recusada).
  private originalExpiry: string | null = null;

  readonly today = todayBr();
  readonly maxDescription = MAX_DESCRIPTION;
  readonly expiredNote = computed(() => {
    const service = this.existing.data();
    return this.isEdit() && service && isExpired(service) && service.expires_at
      ? `Esta vaga venceu em ${formatDay(service.expires_at)} e não aparece para os trabalhadores. Escolha uma nova data para reabrir, ou deixe em branco para ficar sem prazo.`
      : null;
  });

  readonly step = signal<1 | 2>(1);
  readonly saving = signal(false);
  private readonly stepHeading = viewChild<ElementRef<HTMLElement>>('stepHeading');

  readonly form = this.fb.group({
    what: this.fb.group({
      name: ['', Validators.required],
      description: ['', Validators.maxLength(MAX_DESCRIPTION)],
      category: ['', Validators.required]
    }),
    where: this.fb.group({
      farm_id: this.fb.control<number | null>(null, Validators.required),
      duration: this.fb.control<number | null>(null, [Validators.required, positiveNumberValidator]),
      price: this.fb.control<number | null>(null, [Validators.required, positiveNumberValidator]),
      expires_at: ['', (control: AbstractControl<string>) => this.notPastDay(control)]
    })
  });

  readonly durationMessages = { positive: 'Informe quantas horas o serviço deve levar (maior que zero).' };
  readonly priceMessages = { positive: 'Informe um valor maior que zero.' };
  readonly descriptionMessages = { maxlength: 'A descrição pode ter no máximo 2000 caracteres.' };
  readonly expiryMessages = { past: 'Escolha hoje ou uma data futura.' };

  ngOnInit(): void {
    if (this.isEdit()) {
      this.existing.load();
      return;
    }

    const { what, where } = this.form.controls;
    if (this.servico()) what.controls.name.setValue(this.servico() as string);
    if (this.categoria()) what.controls.category.setValue(this.categoria() as string);
    const duration = draftNumber(this.duracao());
    const price = draftNumber(this.valor());
    if (duration) where.controls.duration.setValue(duration);
    if (price) where.controls.price.setValue(price);
  }

  constructor() {
    this.farms.load();
    this.categories.load();

    // Na edição, preenche o formulário uma vez com os dados atuais do serviço.
    effect(() => {
      const service = this.existing.data();
      if (!service || this.filledFromExisting) return;
      this.filledFromExisting = true;
      this.originalExpiry = service.expires_at;
      this.form.setValue({
        what: { name: service.name, description: service.description ?? '', category: service.category },
        where: { farm_id: service.farm_id, duration: service.duration, price: service.price, expires_at: service.expires_at ?? '' }
      });
    });

    // Com uma única fazenda, ela já vem escolhida.
    effect(() => {
      const farms = this.farms.data();
      const farmControl = this.form.controls.where.controls.farm_id;
      if (farms?.length === 1 && farmControl.value === null) {
        farmControl.setValue(farms[0].id);
      }
    });
  }

  reload(): void {
    this.farms.load();
    if (this.isEdit()) this.existing.load();
  }

  next(): void {
    const what = this.form.controls.what;
    what.markAllAsTouched();
    if (what.invalid) return;
    this.goTo(2);
  }

  back(): void {
    this.goTo(1);
  }

  submit(): void {
    const where = this.form.controls.where;
    where.markAllAsTouched();
    if (where.invalid) return;

    const { what, where: place } = this.form.getRawValue();
    const expiresAt = place.expires_at || null;
    const fields = {
      farm_id: place.farm_id as number,
      name: what.name.trim(),
      description: what.description.trim() || null,
      category: what.category,
      duration: place.duration as number,
      price: place.price as number,
      // Na edição, só envia a validade se ela mudou.
      ...(this.isEdit() && expiresAt === this.originalExpiry ? {} : { expires_at: expiresAt })
    };
    this.saving.set(true);

    const serviceId = this.serviceId();
    if (serviceId !== null) {
      this.farmerService.updateService(serviceId, fields).subscribe({
        next: () => {
          this.toast.success('Serviço atualizado.');
          this.router.navigate(['/produtor/servicos', serviceId]);
        },
        error: () => this.saving.set(false)
      });
      return;
    }

    this.farmerService
      .requestService({ farmer_id: this.farmerId, ...fields })
      .subscribe({
        next: ({ service }) => {
          this.toast.success('Serviço publicado. Agora é aguardar as candidaturas.');
          this.router.navigate(['/produtor/servicos', service.id]);
        },
        error: () => this.saving.set(false)
      });
  }

  // Data no passado não é aceita (a não ser a validade atual, sem mudança, de um serviço em edição).
  private notPastDay(control: AbstractControl<string>): ValidationErrors | null {
    const value = control.value;
    if (!value || value === this.originalExpiry) return null;
    return value < todayBr() ? { past: true } : null;
  }

  // Troca de passo e leva o foco para o título do passo (leitores de tela anunciam).
  private goTo(step: 1 | 2): void {
    this.step.set(step);
    afterNextRender(() => this.stepHeading()?.nativeElement.focus(), { injector: this.injector });
  }
}
