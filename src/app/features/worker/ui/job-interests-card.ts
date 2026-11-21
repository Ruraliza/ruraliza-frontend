import { Component, ElementRef, OnInit, PLATFORM_ID, afterNextRender, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatchingService } from '../data-access/matching.service';
import { CategoryService } from '@core/api/category.service';
import { JobPreferences } from '@core/models/matching.model';
import { ToastService } from '@core/toast/toast.service';
import { CategoryGroupPicker } from '@shared/domain/ui/category-group-picker';
import { Button } from '@shared/ui/button';
import { SegmentOption, SegmentedControl } from '@shared/ui/segmented-control';
import { Skeleton } from '@shared/ui/skeleton';
import { SwitchField } from '@shared/ui/switch-field';
import { RemoteData } from '@shared/utils/remote-data';
import { CATALOG_LABEL, CATALOG_NOTICE } from '@shared/domain/utils/catalog';

type Radius = '10' | '30' | '50' | '100';
const RADII: SegmentOption<Radius>[] = [
  { value: '10', label: '10' },
  { value: '30', label: '30' },
  { value: '50', label: '50' },
  { value: '100', label: '100' }
];

// Cartão "Seus interesses" do perfil do trabalhador (issues #23 e #16): as categorias, "perto de mim"
// (a localização do aparelho, guardada pela API só aproximada), os avisos de vaga nova e o catálogo de
// prestadores (ligado por padrão: o perfil aparece para quem publica vagas nas categorias escolhidas).
@Component({
  selector: 'app-job-interests-card',
  imports: [Button, CategoryGroupPicker, SegmentedControl, Skeleton, SwitchField],
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
          <p class="t-body-sm muted">Abra um grupo e escolha os serviços, ou marque o grupo todo.</p>
          <app-category-group-picker [groups]="groups()" [(selected)]="chosen" />
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

        <app-switch-field
          fieldId="interests-catalog"
          [label]="catalogLabel"
          [hint]="catalogNotice"
          [checked]="catalog()"
          (checkedChange)="catalog.set($event)"
        />

        <div><button appButton type="button" [loading]="saving()" (click)="save()">Salvar interesses</button></div>
      }
    </section>
  `,
  styles: `
    :host { display: block; scroll-margin-top: calc(var(--topbar-height) + var(--space-4)); }
    fieldset { display: grid; gap: var(--space-2); margin: 0; padding: 0; border: 0; }
    legend { margin-bottom: var(--space-2); }
    fieldset p { margin: 0; }
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
  private readonly groupList = new RemoteData(() => this.categoryService.getGroups());

  readonly form = new RemoteData(() => this.matching.preferences(this.workerId()));
  readonly chosen = signal<string[]>([]);
  readonly near = signal<JobPreferences['near']>(null);
  readonly alerts = signal(false);
  readonly catalog = signal(true);
  readonly catalogLabel = CATALOG_LABEL;
  readonly catalogNotice = CATALOG_NOTICE;
  readonly saving = signal(false);
  readonly locating = signal(false);
  readonly radii = RADII;

  readonly groups = computed(() => this.groupList.data() ?? []);
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
        this.catalog.set(prefs.catalog);
      });
    });
  }

  ngOnInit(): void {
    this.groupList.load();
    this.form.load();
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
    this.matching.savePreferences(this.workerId(), { categories: this.chosen(), near: this.near(), alerts: this.alerts(), catalog: this.catalog() }).subscribe({
      next: ({ preferences }) => {
        this.saving.set(false);
        this.near.set(preferences.near);
        this.toast.success(preferences.alerts ? 'Interesses salvos. Você vai receber as vagas novas que combinam.' : 'Interesses salvos.');
      },
      error: () => this.saving.set(false)
    });
  }
}
