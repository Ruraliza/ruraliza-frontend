import { Component, ElementRef, OnInit, PLATFORM_ID, afterNextRender, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatchingService } from '../data-access/matching.service';
import { CategoryService } from '@core/api/category.service';
import { JobPreferences } from '@core/models/matching.model';
import { ToastService } from '@core/toast/toast.service';
import { CategoryChip } from '@shared/domain/ui/category-chip';
import { Button } from '@shared/ui/button';
import { SegmentOption, SegmentedControl } from '@shared/ui/segmented-control';
import { Skeleton } from '@shared/ui/skeleton';
import { SwitchField } from '@shared/ui/switch-field';
import { RemoteData } from '@shared/utils/remote-data';

type Radius = '10' | '30' | '50' | '100';
const RADII: SegmentOption<Radius>[] = [
  { value: '10', label: '10' },
  { value: '30', label: '30' },
  { value: '50', label: '50' },
  { value: '100', label: '100' }
];

// Cartão "Seus interesses" do perfil do trabalhador (issues #23 e #16): as categorias, "perto de mim"
// (a localização do aparelho, guardada pela API só aproximada) e os avisos de vaga nova.
@Component({
  selector: 'app-job-interests-card',
  imports: [Button, CategoryChip, SegmentedControl, Skeleton, SwitchField],
  host: { id: 'interesses' },
  template: `
    <section class="card stack" aria-labelledby="interests-title">
      <div class="stack-sm">
        <h2 id="interests-title" class="t-h3">Seus interesses</h2>
        <p class="t-body-sm muted">O app usa isto para separar as vagas para você, no Início, e para avisar quando abrir uma vaga assim.</p>
      </div>

      @if (form.state().status === 'loading') {
        <app-skeleton [count]="1" [height]="120" />
      } @else {
        <fieldset>
          <legend class="t-label">O que você quer fazer</legend>
          <div class="cluster">
            @for (category of categories(); track category) {
              <button appCategoryChip [interactive]="true" [selected]="chosen().includes(category)" (click)="toggle(category)">{{ category }}</button>
            }
          </div>
        </fieldset>

        <app-switch-field
          fieldId="interests-near"
          label="Perto de mim"
          [hint]="nearHint()"
          [checked]="near() !== null"
          (checkedChange)="$event ? locate() : near.set(null)"
        />
        @if (near()) {
          <div class="radius">
            <p class="t-label" id="interests-radius">Até onde você vai, em km</p>
            <app-segmented-control label="Até onde você vai, em km" [options]="radii" [value]="radius()" (valueChange)="setRadius($event)" />
          </div>
        }

        <app-switch-field
          fieldId="interests-alerts"
          label="Me avisar de vagas novas"
          hint="Na hora, quando abrir uma vaga que combina (no máximo 3 por dia), e um resumo por semana."
          [checked]="alerts()"
          (checkedChange)="alerts.set($event)"
        />

        <div><button appButton type="button" [loading]="saving()" (click)="save()">Salvar interesses</button></div>
      }
    </section>
  `,
  styles: `
    :host { display: block; scroll-margin-top: calc(var(--topbar-height) + var(--space-4)); }
    fieldset { display: grid; gap: var(--space-2); margin: 0; padding: 0; border: 0; }
    legend { margin-bottom: var(--space-2); }
    .radius { display: grid; gap: var(--space-2); margin-top: calc(-1 * var(--space-2)); }
    .radius p { margin: 0; }
  `
})
export class JobInterestsCard implements OnInit {
  readonly workerId = input.required<number>();

  private readonly matching = inject(MatchingService);
  private readonly toast = inject(ToastService);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly categoryService = inject(CategoryService);
  private readonly categoryList = new RemoteData(() => this.categoryService.getCategories());

  readonly form = new RemoteData(() => this.matching.preferences(this.workerId()));
  readonly chosen = signal<string[]>([]);
  readonly near = signal<JobPreferences['near']>(null);
  readonly alerts = signal(false);
  readonly saving = signal(false);
  readonly locating = signal(false);
  readonly radii = RADII;

  readonly categories = computed(() => this.categoryList.data() ?? []);
  readonly radius = computed<Radius>(() => {
    const km = String(this.near()?.radius_km ?? 30);
    return RADII.some((r) => r.value === km) ? (km as Radius) : '30';
  });
  readonly nearHint = computed(() => {
    if (this.locating()) return 'Pegando sua localização…';
    return this.near()
      ? `Só vagas a até ${this.near()?.radius_km} km de onde você está agora (o app guarda só a região, cerca de 1 km).`
      : 'Usa a localização do aparelho uma vez; o app guarda só a região, cerca de 1 km.';
  });

  constructor() {
    // Veio de "Ajustar interesses" (#interesses): o cartão aparece depois do perfil, então rola até ele aqui.
    const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const fragment = inject(ActivatedRoute).snapshot.fragment;
    afterNextRender(() => {
      if (fragment === 'interesses') host.scrollIntoView({ block: 'start' });
    });
    // Preenche o formulário quando as preferências salvas chegam.
    effect(() => {
      const prefs = this.form.data();
      if (!prefs) return;
      untracked(() => {
        this.chosen.set(prefs.categories);
        this.near.set(prefs.near);
        this.alerts.set(prefs.alerts);
      });
    });
  }

  ngOnInit(): void {
    this.categoryList.load();
    this.form.load();
  }

  toggle(category: string): void {
    this.chosen.update((list) => (list.includes(category) ? list.filter((c) => c !== category) : [...list, category]));
  }

  setRadius(value: Radius): void {
    const near = this.near();
    if (near) this.near.set({ ...near, radius_km: Number(value) });
  }

  locate(): void {
    if (!this.isBrowser || !('geolocation' in navigator)) {
      this.toast.error('Este aparelho não informa a localização.');
      return;
    }
    this.locating.set(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        this.locating.set(false);
        this.near.set({ latitude: coords.latitude, longitude: coords.longitude, radius_km: Number(this.radius()) });
      },
      () => {
        this.locating.set(false);
        this.near.set(null);
        this.toast.error('Não foi possível pegar sua localização. Confira se o navegador tem permissão.');
      },
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 600000 }
    );
  }

  save(): void {
    this.saving.set(true);
    this.matching.savePreferences(this.workerId(), { categories: this.chosen(), near: this.near(), alerts: this.alerts() }).subscribe({
      next: ({ preferences }) => {
        this.saving.set(false);
        this.near.set(preferences.near);
        this.toast.success(preferences.alerts ? 'Interesses salvos. Você vai receber as vagas novas que combinam.' : 'Interesses salvos.');
      },
      error: () => this.saving.set(false)
    });
  }
}
