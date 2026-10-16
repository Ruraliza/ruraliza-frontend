import { Component, computed, effect, inject, input, output, signal, untracked } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { CategoryService } from '@core/api/category.service';
import { Sponsor, SponsorAudience, SponsorCard, SponsorInput } from '@core/models/sponsor.model';
import { CategoryChip } from '@shared/domain/ui/category-chip';
import { SponsorCardView } from '@shared/domain/ui/sponsor-card';
import { Button } from '@shared/ui/button';
import { FormField } from '@shared/ui/form-field';
import { SegmentOption, SegmentedControl } from '@shared/ui/segmented-control';
import { noBlockedTerms } from '@shared/utils/moderation';
import { UFS } from '@shared/utils/ufs';

// Limites iguais aos da API.
const LIMITS = { sponsor: 60, title: 90, text: 180, cta_label: 24 } as const;
const AUDIENCES: SegmentOption<SponsorAudience>[] = [
  { value: 'all', label: 'Todos' },
  { value: 'farmer', label: 'Produtores' },
  { value: 'worker', label: 'Trabalhadores' }
];
const httpsUrl = Validators.pattern(/^https:\/\/\S+\.\S+$/);

// Formulário do patrocínio com a prévia do cartão como vai aparecer no app. `sponsor` = editar; null = novo.
@Component({
  selector: 'app-sponsor-editor',
  imports: [ReactiveFormsModule, Button, CategoryChip, FormField, SegmentedControl, SponsorCardView],
  template: `
    <form class="card editor" [formGroup]="form" (ngSubmit)="submit()" novalidate>
      <div class="fields">
        <h2 class="t-h3">{{ sponsor() ? 'Editar patrocínio' : 'Novo patrocínio' }}</h2>
        <app-form-field label="Anunciante" fieldId="sp-sponsor" [control]="form.controls.sponsor">
          <input formControlName="sponsor" [maxlength]="limits.sponsor" placeholder="Ex.: Casa Agrícola Boa Safra">
        </app-form-field>
        <app-form-field label="Chamada" fieldId="sp-title" [control]="form.controls.title" [hint]="'Até ' + limits.title + ' caracteres.'">
          <input formControlName="title" [maxlength]="limits.title">
        </app-form-field>
        <app-form-field label="Detalhe (opcional)" fieldId="sp-text" [control]="form.controls.text">
          <textarea formControlName="text" rows="2" [maxlength]="limits.text"></textarea>
        </app-form-field>
        <div class="pair">
          <app-form-field label="Texto do botão" fieldId="sp-cta" [control]="form.controls.cta_label">
            <input formControlName="cta_label" [maxlength]="limits.cta_label" placeholder="Ver a oferta">
          </app-form-field>
          <app-form-field label="Link" fieldId="sp-url" [control]="form.controls.url" [messages]="{ pattern: 'Use um link completo, começando com https://.' }">
            <input formControlName="url" type="url" inputmode="url" placeholder="https://">
          </app-form-field>
        </div>

        <div class="group">
          <p class="t-label">Quem vê</p>
          <app-segmented-control label="Quem vê" [options]="audiences" [value]="audience()" (valueChange)="form.controls.audience.setValue($event)" />
        </div>
        <div class="group">
          <p class="t-label">Onde aparece <span class="muted">(nenhuma UF marcada: todo o Brasil)</span></p>
          <div class="cluster ufs">
            @for (uf of ufs; track uf) {
              <button appCategoryChip [interactive]="true" [selected]="states().includes(uf)" (click)="toggle('states', uf)">{{ uf }}</button>
            }
          </div>
        </div>
        @if (audience() !== 'farmer') {
          <div class="group">
            <p class="t-label">Interesses dos trabalhadores <span class="muted">(nenhum marcado: qualquer um)</span></p>
            <div class="cluster">
              @for (c of categoryList(); track c) {
                <button appCategoryChip [interactive]="true" [selected]="categories().includes(c)" (click)="toggle('categories', c)">{{ c }}</button>
              }
            </div>
          </div>
        }
        <div class="pair">
          <app-form-field label="Primeiro dia (opcional)" fieldId="sp-start" [control]="form.controls.starts_on">
            <input type="date" formControlName="starts_on">
          </app-form-field>
          <app-form-field label="Último dia (opcional)" fieldId="sp-end" [control]="form.controls.ends_on">
            <input type="date" formControlName="ends_on">
          </app-form-field>
        </div>
        <label class="check"><input type="checkbox" formControlName="active"><span>Ativo (aparece no app)</span></label>

        <div class="form-actions">
          <button appButton variant="secondary" type="button" [disabled]="saving()" (click)="cancelled.emit()">Cancelar</button>
          <button appButton type="submit" [loading]="saving()">{{ sponsor() ? 'Salvar patrocínio' : 'Criar patrocínio' }}</button>
        </div>
      </div>

      <div class="preview">
        <p class="t-label muted">Prévia</p>
        <app-sponsor-card [card]="preview()" />
        @if (sponsor()) { <p class="t-body-sm muted">A logo fica no cartão da lista, em "Enviar logo".</p> }
      </div>
    </form>
  `,
  styles: `
    .editor { display: grid; gap: var(--space-6); }
    .fields { display: grid; gap: var(--space-4); }
    h2, p { margin: 0; }
    .pair { display: grid; gap: var(--space-4); grid-template-columns: repeat(auto-fit, minmax(min(100%, 220px), 1fr)); }
    .group { display: grid; gap: var(--space-2); }
    .ufs button { min-width: 3.25rem; justify-content: center; }
    .check { display: flex; align-items: center; gap: var(--space-2); min-height: 44px; font-weight: 600; }
    .preview { display: grid; gap: var(--space-2); align-content: start; }
    @media (min-width: 1100px) {
      .editor { grid-template-columns: minmax(0, 1fr) 360px; }
      .preview { position: sticky; top: calc(var(--shell-top, 0px) + var(--space-6)); }
    }
  `
})
export class SponsorEditor {
  readonly sponsor = input<Sponsor | null>(null);
  readonly saving = input(false);
  readonly saved = output<SponsorInput>();
  readonly cancelled = output<void>();

  private readonly fb = inject(NonNullableFormBuilder);
  readonly categoryList = toSignal(inject(CategoryService).getCategories(), { initialValue: [] as string[] });
  readonly limits = LIMITS;
  readonly audiences = AUDIENCES;
  readonly ufs = UFS;

  readonly form = this.fb.group({
    sponsor: ['', [Validators.required, Validators.maxLength(LIMITS.sponsor), noBlockedTerms]],
    title: ['', [Validators.required, Validators.maxLength(LIMITS.title), noBlockedTerms]],
    text: ['', [Validators.maxLength(LIMITS.text), noBlockedTerms]],
    cta_label: ['Ver a oferta', [Validators.required, Validators.maxLength(LIMITS.cta_label), noBlockedTerms]],
    url: ['https://', [Validators.required, httpsUrl]],
    audience: this.fb.control<SponsorAudience>('all'),
    starts_on: [''],
    ends_on: [''],
    active: [true]
  });
  readonly states = signal<string[]>([]);
  readonly categories = signal<string[]>([]);

  private readonly values = toSignal(this.form.valueChanges, { initialValue: this.form.getRawValue() });
  readonly audience = computed(() => this.values().audience ?? 'all');
  readonly preview = computed<SponsorCard>(() => {
    const v = this.values();
    return {
      id: this.sponsor()?.id ?? 0,
      sponsor: v.sponsor || 'Nome do anunciante',
      title: v.title || 'A chamada aparece aqui',
      text: v.text || null,
      cta_label: v.cta_label || 'Ver a oferta',
      url: v.url ?? 'https://',
      image_url: this.sponsor()?.image_url ?? null
    };
  });

  constructor() {
    // Editar: o formulário começa com o patrocínio.
    effect(() => {
      const sponsor = this.sponsor();
      untracked(() => {
        if (!sponsor) return;
        this.form.reset({
          sponsor: sponsor.sponsor, title: sponsor.title, text: sponsor.text ?? '', cta_label: sponsor.cta_label, url: sponsor.url,
          audience: sponsor.audience, starts_on: sponsor.starts_on ?? '', ends_on: sponsor.ends_on ?? '', active: sponsor.active
        });
        this.states.set([...sponsor.states]);
        this.categories.set([...sponsor.categories]);
      });
    });
  }

  toggle(list: 'states' | 'categories', value: string): void {
    this[list].update((items) => (items.includes(value) ? items.filter((i) => i !== value) : [...items, value]));
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    this.saved.emit({
      sponsor: v.sponsor.trim(), title: v.title.trim(), text: v.text.trim() || null, cta_label: v.cta_label.trim(), url: v.url.trim(),
      audience: v.audience, states: this.states(), categories: v.audience === 'farmer' ? [] : this.categories(),
      starts_on: v.starts_on || null, ends_on: v.ends_on || null, active: v.active
    });
  }
}
