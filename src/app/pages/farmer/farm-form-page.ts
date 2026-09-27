import { Component, inject, input, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { FarmerService } from '../../core/api/farmer.service';
import { CurrentUserService } from '../../core/session/current-user.service';
import { ToastService } from '../../core/toast/toast.service';
import { Button } from '../../shared/ui/button';
import { FormField } from '../../shared/ui/form-field';

const UFS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA',
  'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

@Component({
  selector: 'app-farm-form-page',
  imports: [ReactiveFormsModule, RouterLink, Button, FormField],
  template: `
    <div class="container page">
      <a class="back-link" [routerLink]="returnUrl()">← Voltar</a>
      <div class="page-header">
        <div>
          <h1>Cadastrar fazenda</h1>
          <p class="muted">Onde os serviços vão acontecer.</p>
        </div>
      </div>

      <form class="form card" [formGroup]="form" (ngSubmit)="submit()" novalidate>
        <app-form-field label="Endereço" fieldId="address" hint="Estrada, número ou quilômetro." [control]="form.controls.address">
          <input formControlName="address" autocomplete="street-address" placeholder="Estrada de Terra, Km 2">
        </app-form-field>

        <app-form-field label="Cidade" fieldId="city" [control]="form.controls.city">
          <input formControlName="city" autocomplete="address-level2" placeholder="Três Rios">
        </app-form-field>

        <app-form-field label="Estado (UF)" fieldId="state" [control]="form.controls.state">
          <select formControlName="state" autocomplete="address-level1">
            <option value="" disabled>Escolha o estado</option>
            @for (uf of ufs; track uf) { <option [value]="uf">{{ uf }}</option> }
          </select>
        </app-form-field>

        <div class="form-actions">
          <button appButton type="submit" [loading]="saving()">Cadastrar fazenda</button>
          <a appButton variant="ghost" [routerLink]="returnUrl()">Cancelar</a>
        </div>
      </form>
    </div>
  `
})
export class FarmFormPage {
  // ?voltar=servico: veio do formulário de novo serviço e deve voltar para ele.
  readonly voltar = input<string>();

  private readonly fb = inject(NonNullableFormBuilder);
  private readonly farmerService = inject(FarmerService);
  private readonly farmerId = inject(CurrentUserService).requireId('farmer');
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  readonly ufs = UFS;
  readonly saving = signal(false);

  readonly form = this.fb.group({
    address: ['', Validators.required],
    city: ['', Validators.required],
    state: ['', Validators.required]
  });

  returnUrl(): string {
    return this.voltar() === 'servico' ? '/produtor/servicos/novo' : '/produtor/fazendas';
  }

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    const { address, city, state } = this.form.getRawValue();
    this.saving.set(true);
    this.farmerService.createFarm(this.farmerId, { address: address.trim(), city: city.trim(), state }).subscribe({
      next: () => {
        this.toast.success('Fazenda cadastrada.');
        this.router.navigateByUrl(this.returnUrl());
      },
      error: () => this.saving.set(false)
    });
  }
}
