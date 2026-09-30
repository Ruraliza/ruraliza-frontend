import { Component, DestroyRef, OnInit, computed, effect, inject, input, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Observable, concatMap, from, last } from 'rxjs';
import { FarmerService } from '../../core/api/farmer.service';
import { CurrentUserService } from '../../core/session/current-user.service';
import { ToastService } from '../../core/toast/toast.service';
import { Farm, FarmPhoto } from '../../../models/farm.model';
import { RemoteData } from '../../shared/utils/remote-data';
import { Button } from '../../shared/ui/button';
import { EmptyState } from '../../shared/ui/empty-state';
import { ErrorState } from '../../shared/ui/error-state';
import { FormField } from '../../shared/ui/form-field';
import { GridPhoto, PhotoGridEditor } from '../../shared/ui/photo-grid-editor';
import { Skeleton } from '../../shared/ui/skeleton';
import { draftParams } from '../../shared/utils/service-draft';
import { apiAsset } from '../../shared/utils/images';

const MAX_FARM_PHOTOS = 6;

// Foto escolhida no cadastro, antes de a fazenda existir: sobe logo depois do cadastro.
interface QueuedPhoto {
  id: string;
  blob: Blob;
  src: string; // object URL para a prévia
}

const UFS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA',
  'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

// Cadastro de fazenda. Com :id na rota (/fazendas/:id/editar), o mesmo formulário edita.
@Component({
  selector: 'app-farm-form-page',
  imports: [ReactiveFormsModule, RouterLink, Button, EmptyState, ErrorState, FormField, PhotoGridEditor, Skeleton],
  template: `
    <div class="container page">
      <a class="back-link" [routerLink]="returnUrl()" [queryParams]="returnParams()">← Voltar</a>
      <div class="page-header">
        <div>
          <h1>{{ isEdit() ? 'Editar fazenda' : 'Cadastrar fazenda' }}</h1>
          <p class="muted">Onde os serviços vão acontecer.</p>
        </div>
      </div>

      @switch (loadState()) {
        @case ('loading') { <app-skeleton [count]="1" [height]="320" /> }
        @case ('error') { <app-error-state [message]="farms.error()" (retry)="farms.load()" /> }
        @case ('missing') {
          <app-empty-state icon="farm" title="Fazenda não encontrada" message="Ela pode ter sido removida ou ser de outro produtor.">
            <a appButton routerLink="/produtor/fazendas">Ver minhas fazendas</a>
          </app-empty-state>
        }
        @case ('ready') {
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

            <app-photo-grid-editor
              [label]="isEdit() ? 'Fotos da fazenda' : 'Fotos da fazenda (opcional)'"
              [photos]="gridPhotos()"
              [max]="maxPhotos"
              [busy]="photoBusy()"
              (added)="addPhotos($event)"
              (removed)="removePhoto($event)"
            />

            <div class="form-actions">
              <button appButton type="submit" [loading]="saving()" [disabled]="photoBusy()">{{ isEdit() ? 'Salvar alterações' : 'Cadastrar fazenda' }}</button>
              <a appButton variant="ghost" [routerLink]="returnUrl()" [queryParams]="returnParams()">Cancelar</a>
            </div>
          </form>
        }
      }
    </div>
  `
})
export class FarmFormPage implements OnInit {
  readonly id = input<string>(); // parâmetro :id da rota, só na edição
  // ?voltar=servico: veio do formulário de novo serviço e deve voltar para ele.
  readonly voltar = input<string>();
  readonly servico = input<string>();
  readonly categoria = input<string>();
  readonly duracao = input<string>();
  readonly valor = input<string>();
  // Ao voltar para o novo serviço, o rascunho da landing segue junto.
  readonly returnParams = computed(() =>
    this.voltar() === 'servico'
      ? draftParams({ servico: this.servico(), categoria: this.categoria(), duracao: this.duracao(), valor: this.valor() })
      : {}
  );

  private readonly fb = inject(NonNullableFormBuilder);
  private readonly farmerService = inject(FarmerService);
  private readonly farmerId = inject(CurrentUserService).requireId('farmer');
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  readonly ufs = UFS;
  readonly maxPhotos = MAX_FARM_PHOTOS;
  readonly saving = signal(false);
  readonly photoBusy = signal(false);

  // Fotos já salvas (edição) e fotos na fila (cadastro).
  private readonly savedPhotos = signal<FarmPhoto[]>([]);
  private readonly queued = signal<QueuedPhoto[]>([]);
  private queueSeq = 0;
  readonly gridPhotos = computed<GridPhoto[]>(() =>
    this.isEdit()
      ? this.savedPhotos().map((p) => ({ id: p.id, src: apiAsset(p.url) }))
      : this.queued().map((q) => ({ id: q.id, src: q.src }))
  );

  readonly farmId = computed(() => (this.id() ? Number(this.id()) : null));
  readonly isEdit = computed(() => this.farmId() !== null);
  // Não há GET de uma fazenda só: a edição busca na lista do produtor (que já filtra as dele).
  readonly farms = new RemoteData(() => this.farmerService.getFarms(this.farmerId));
  readonly existing = computed(() => this.farms.data()?.find((f) => f.id === this.farmId()) ?? null);
  readonly loadState = computed<'loading' | 'error' | 'missing' | 'ready'>(() => {
    if (!this.isEdit()) return 'ready';
    const status = this.farms.state().status;
    if (status !== 'success') return status;
    return this.existing() ? 'ready' : 'missing';
  });

  readonly form = this.fb.group({
    address: ['', Validators.required],
    city: ['', Validators.required],
    state: ['', Validators.required]
  });

  constructor() {
    // Na edição, preenche o formulário com os dados atuais da fazenda.
    effect(() => {
      const farm = this.existing();
      if (farm) {
        this.form.setValue({ address: farm.address, city: farm.city, state: farm.state });
        this.savedPhotos.set(farm.photos);
      }
    });
    inject(DestroyRef).onDestroy(() => this.queued().forEach((q) => URL.revokeObjectURL(q.src)));
  }

  addPhotos(blobs: Blob[]): void {
    const farmId = this.farmId();
    if (farmId === null) {
      // Cadastro: guarda na fila, com prévia local.
      this.queued.update((list) => [...list, ...blobs.map((blob) => ({ id: `fila-${++this.queueSeq}`, blob, src: URL.createObjectURL(blob) }))]);
      return;
    }
    this.photoBusy.set(true);
    this.uploadAll(farmId, blobs).subscribe({
      next: (farm) => {
        this.savedPhotos.set(farm.photos);
        this.photoBusy.set(false);
        this.toast.success(blobs.length === 1 ? 'Foto adicionada.' : `${blobs.length} fotos adicionadas.`);
      },
      error: () => {
        this.photoBusy.set(false);
        this.farms.load(); // mostra as que chegaram a subir
      }
    });
  }

  removePhoto(photoId: string): void {
    const farmId = this.farmId();
    if (farmId === null) {
      const item = this.queued().find((q) => q.id === photoId);
      if (item) URL.revokeObjectURL(item.src);
      this.queued.update((list) => list.filter((q) => q.id !== photoId));
      return;
    }
    this.photoBusy.set(true);
    this.farmerService.deleteFarmPhoto(this.farmerId, farmId, photoId).subscribe({
      next: ({ farm }) => {
        this.savedPhotos.set(farm.photos);
        this.photoBusy.set(false);
        this.toast.success('Foto removida.');
      },
      error: () => this.photoBusy.set(false)
    });
  }

  // Envia uma foto por vez (a ordem define a capa) e devolve a fazenda depois da última.
  private uploadAll(farmId: number, blobs: Blob[]): Observable<Farm> {
    return from(blobs).pipe(
      concatMap((blob) => this.farmerService.addFarmPhoto(this.farmerId, farmId, blob)),
      last(),
      concatMap(({ farm }) => [farm])
    );
  }

  ngOnInit(): void {
    if (this.isEdit()) this.farms.load();
  }

  returnUrl(): string {
    return this.voltar() === 'servico' ? '/produtor/servicos/novo' : '/produtor/fazendas';
  }

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    const { address, city, state } = this.form.getRawValue();
    const fields = { address: address.trim(), city: city.trim(), state };
    const farmId = this.farmId();
    const request = farmId !== null
      ? this.farmerService.updateFarm(this.farmerId, farmId, fields)
      : this.farmerService.createFarm(this.farmerId, fields);

    this.saving.set(true);
    request.subscribe({
      next: ({ farm }) => {
        const queued = this.queued();
        if (farmId !== null || queued.length === 0) {
          this.toast.success(farmId !== null ? 'Fazenda atualizada.' : 'Fazenda cadastrada.');
          this.router.navigate([this.returnUrl()], { queryParams: this.returnParams() });
          return;
        }
        // Cadastro com fotos na fila: sobe as fotos agora que a fazenda existe.
        this.uploadAll(farm.id, queued.map((q) => q.blob)).subscribe({
          next: () => {
            this.toast.success('Fazenda cadastrada com as fotos.');
            this.router.navigate([this.returnUrl()], { queryParams: this.returnParams() });
          },
          error: () => {
            // A fazenda já existe: leva para a edição, onde dá para reenviar as fotos.
            this.toast.info('Fazenda cadastrada, mas algumas fotos não foram enviadas. Tente de novo aqui.');
            this.router.navigate(['/produtor/fazendas', farm.id, 'editar']);
          }
        });
      },
      error: () => this.saving.set(false)
    });
  }
}
