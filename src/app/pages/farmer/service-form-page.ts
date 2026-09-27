import { Component, ElementRef, Injector, afterNextRender, effect, inject, signal, viewChild } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CategoryService } from '../../core/api/category.service';
import { FarmerService } from '../../core/api/farmer.service';
import { CurrentUserService } from '../../core/session/current-user.service';
import { ToastService } from '../../core/toast/toast.service';
import { RemoteData } from '../../shared/utils/remote-data';
import { positiveNumberValidator } from '../../shared/utils/validators';
import { Button } from '../../shared/ui/button';
import { EmptyState } from '../../shared/ui/empty-state';
import { ErrorState } from '../../shared/ui/error-state';
import { FormField } from '../../shared/ui/form-field';
import { MaskedInput } from '../../shared/ui/masked-input';
import { Skeleton } from '../../shared/ui/skeleton';

// Novo serviço em 2 passos: o quê (nome, categoria) → onde/quanto (fazenda, horas, valor).
@Component({
  selector: 'app-service-form-page',
  imports: [ReactiveFormsModule, RouterLink, Button, EmptyState, ErrorState, FormField, MaskedInput, Skeleton],
  templateUrl: './service-form-page.html',
  styleUrl: './service-form-page.css'
})
export class ServiceFormPage {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly farmerService = inject(FarmerService);
  private readonly categoryService = inject(CategoryService);
  private readonly farmerId = inject(CurrentUserService).requireId('farmer');
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly injector = inject(Injector);

  readonly farms = new RemoteData(() => this.farmerService.getFarms(this.farmerId));
  readonly categories = new RemoteData(() => this.categoryService.getCategories());

  readonly step = signal<1 | 2>(1);
  readonly saving = signal(false);
  private readonly stepHeading = viewChild<ElementRef<HTMLElement>>('stepHeading');

  readonly form = this.fb.group({
    what: this.fb.group({
      name: ['', Validators.required],
      category: ['', Validators.required]
    }),
    where: this.fb.group({
      farm_id: this.fb.control<number | null>(null, Validators.required),
      duration: this.fb.control<number | null>(null, [Validators.required, positiveNumberValidator]),
      price: this.fb.control<number | null>(null, [Validators.required, positiveNumberValidator])
    })
  });

  readonly durationMessages = { positive: 'Informe quantas horas o serviço deve levar (maior que zero).' };
  readonly priceMessages = { positive: 'Informe um valor maior que zero.' };

  constructor() {
    this.farms.load();
    this.categories.load();

    // Com uma única fazenda, ela já vem escolhida.
    effect(() => {
      const farms = this.farms.data();
      const farmControl = this.form.controls.where.controls.farm_id;
      if (farms?.length === 1 && farmControl.value === null) {
        farmControl.setValue(farms[0].id);
      }
    });
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
    this.saving.set(true);
    this.farmerService
      .requestService({
        farmer_id: this.farmerId,
        farm_id: place.farm_id as number,
        name: what.name.trim(),
        category: what.category,
        duration: place.duration as number,
        price: place.price as number
      })
      .subscribe({
        next: ({ service }) => {
          this.toast.success('Serviço publicado. Agora é aguardar as candidaturas.');
          this.router.navigate(['/produtor/servicos', service.id]);
        },
        error: () => this.saving.set(false)
      });
  }

  // Troca de passo e leva o foco para o título do passo (leitores de tela anunciam).
  private goTo(step: 1 | 2): void {
    this.step.set(step);
    afterNextRender(() => this.stepHeading()?.nativeElement.focus(), { injector: this.injector });
  }
}
