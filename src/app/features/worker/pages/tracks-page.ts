import { Component, DestroyRef, computed, effect, inject, input, linkedSignal, untracked } from '@angular/core';
import { ActivatedRoute, Params, Router, RouterLink } from '@angular/router';
import { CategoryService } from '@core/api/category.service';
import { CurrentUserService } from '@core/session/current-user.service';
import { TrackFilters } from '@core/models/track.model';
import { RemoteData } from '@shared/utils/remote-data';
import { Button } from '@shared/ui/button';
import { CategoryChip } from '@shared/domain/ui/category-chip';
import { EmptyState } from '@shared/ui/empty-state';
import { ErrorState } from '@shared/ui/error-state';
import { Icon } from '@shared/ui/icon';
import { Skeleton } from '@shared/ui/skeleton';
import { LearningService } from '../data-access/learning.service';
import { TrackCard } from '../ui/track-card';

const SEARCH_DELAY_MS = 350;

// Trilhas de estudo, filtradas pelos tipos de serviço em dois níveis (grupo > serviço), como nas vagas.
// A URL guarda os filtros (?q=&grupo=&categoria=). O serviço e a busca vão para a API; o grupo é filtrado
// aqui, porque a lista de trilhas é pequena. As que o trabalhador já começou aparecem primeiro.
@Component({
  selector: 'app-tracks-page',
  imports: [RouterLink, Button, CategoryChip, EmptyState, ErrorState, Icon, Skeleton, TrackCard],
  template: `
    <div class="container page">
      <div class="page-header">
        <div>
          <h1>Trilhas de estudo</h1>
          <p class="muted">Cursos curtos para se qualificar nos serviços do campo, com certificado da Ruraliza.</p>
        </div>
        <a appButton variant="secondary" routerLink="/trabalhador/certificados"><app-icon name="award" [size]="20" />Meus certificados</a>
      </div>

      <div class="filters">
        <label class="search">
          <span class="visually-hidden">Buscar trilhas</span>
          <app-icon name="search" [size]="20" />
          <input type="search" placeholder="Buscar por tema ou palavra" [value]="draftQuery()" (input)="onSearch($event)">
        </label>
        @if (categories.state().status === 'success') {
          <div class="cluster chips" role="group" aria-label="Filtrar por grupo de serviço">
            <button appCategoryChip [interactive]="true" [selected]="!activeGroup()" (click)="setParams({ grupo: null, categoria: null })">Todas</button>
            @for (g of categories.data(); track g.name) {
              <button appCategoryChip [interactive]="true" [selected]="activeGroup()?.name === g.name" (click)="setParams({ grupo: g.name, categoria: null })">{{ g.name }}</button>
            }
          </div>
          @if (activeGroup(); as group) {
            @if (group.services.length > 1) {
              <div class="cluster chips services" role="group" [attr.aria-label]="'Serviços em ' + group.name">
                <button appCategoryChip [interactive]="true" [selected]="!categoria()" (click)="setParams({ grupo: group.name, categoria: null })">Tudo em {{ group.name }}</button>
                @for (c of group.services; track c) {
                  <button appCategoryChip [interactive]="true" [selected]="categoria() === c" (click)="setParams({ grupo: group.name, categoria: c })">{{ c }}</button>
                }
              </div>
            }
          }
        }
      </div>

      @switch (tracks.state().status) {
        @case ('loading') { <app-skeleton [count]="3" [height]="220" /> }
        @case ('error') { <app-error-state [message]="tracks.error()" (retry)="tracks.load()" /> }
        @case ('success') {
          @if (inProgress().length) {
            <section class="stack" aria-labelledby="em-andamento">
              <h2 id="em-andamento" class="t-h3">Continue estudando</h2>
              <ul class="resume-list" role="list">
                @for (t of inProgress(); track t.id) { <li><app-track-card [track]="t" variant="resume" /></li> }
              </ul>
            </section>
          }
          @if (others().length) {
            <section class="stack" aria-labelledby="todas">
              <h2 id="todas" class="t-h3">{{ inProgress().length ? 'Outras trilhas' : 'Trilhas disponíveis' }}</h2>
              <ul class="grid-cards" role="list">
                @for (t of others(); track t.id) { <li><app-track-card [track]="t" /></li> }
              </ul>
            </section>
          }
          @if (!inProgress().length && !others().length) {
            <app-empty-state
              icon="book"
              [title]="anyFilter() ? 'Nenhuma trilha encontrada' : 'Ainda não há trilhas'"
              [message]="anyFilter() ? 'Tente outro serviço ou outra palavra.' : 'Os tutores da Ruraliza estão preparando as primeiras trilhas.'"
            >
              @if (anyFilter()) { <button appButton variant="secondary" type="button" (click)="clearFilters()">Limpar filtros</button> }
            </app-empty-state>
          }
        }
      }
    </div>
  `,
  styles: `
    .filters { display: grid; gap: var(--space-4); }
    .search { position: relative; display: block; max-width: 560px; }
    .search app-icon { position: absolute; left: 14px; top: 14px; color: var(--ink-muted); pointer-events: none; }
    .search input { padding-left: 44px; border-radius: var(--radius-pill); }
    .chips { flex-wrap: nowrap; overflow-x: auto; padding: var(--space-1) 0 var(--space-2); scrollbar-width: thin; }
    @media (min-width: 768px) { .chips { flex-wrap: wrap; overflow-x: visible; } }
    .services { margin-top: calc(-1 * var(--space-2)); padding-top: var(--space-2); border-top: 1px solid var(--line); }
    .grid-cards > li { display: grid; }
    .resume-list { display: grid; gap: var(--space-4); max-width: 880px; margin: 0; padding: 0; list-style: none; }
  `
})
export class TracksPage {
  // Query params (withComponentInputBinding).
  readonly q = input<string>();
  readonly grupo = input<string>();
  readonly categoria = input<string>();

  private readonly learning = inject(LearningService);
  private readonly categoryService = inject(CategoryService);
  private readonly workerId = inject(CurrentUserService).requireId('worker');
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly filters = computed<TrackFilters>(() => ({
    q: this.q() || undefined,
    category: this.categoria() || undefined,
    worker_id: this.workerId
  }));
  readonly anyFilter = computed(() => !!(this.q() || this.grupo() || this.categoria()));

  readonly draftQuery = linkedSignal(() => this.q() ?? '');
  private searchTimer: ReturnType<typeof setTimeout> | undefined;

  readonly categories = new RemoteData(() => this.categoryService.getGroups());
  readonly tracks = new RemoteData(() => this.learning.listTracks(this.filters()));

  // Grupo marcado: o da URL ou, num link só com ?categoria=, o grupo desse serviço.
  readonly activeGroup = computed(() => {
    const groups = this.categories.data() ?? [];
    const category = this.categoria();
    return groups.find((g) => g.name === this.grupo()) ?? groups.find((g) => category !== undefined && g.services.includes(category)) ?? null;
  });
  // Com grupo e sem serviço, ficam as trilhas com algum serviço do grupo.
  private readonly visible = computed(() => {
    const list = this.tracks.data() ?? [];
    const group = this.activeGroup();
    return group && !this.categoria() ? list.filter((t) => t.categories.some((c) => group.services.includes(c))) : list;
  });
  readonly inProgress = computed(() => this.visible().filter((t) => t.progress !== null && t.progress.completed_at === null));
  readonly others = computed(() => this.visible().filter((t) => t.progress === null || t.progress.completed_at !== null));

  constructor() {
    this.categories.load();
    inject(DestroyRef).onDestroy(() => clearTimeout(this.searchTimer));
    effect(() => {
      this.filters();
      untracked(() => this.tracks.load());
    });
  }

  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.draftQuery.set(value);
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => this.setParams({ q: value.trim() || null }), SEARCH_DELAY_MS);
  }

  clearFilters(): void {
    clearTimeout(this.searchTimer);
    this.draftQuery.set('');
    this.setParams({ q: null, grupo: null, categoria: null });
  }

  setParams(params: Params): void {
    void this.router.navigate([], { relativeTo: this.route, queryParams: params, queryParamsHandling: 'merge', replaceUrl: true });
  }
}
