import { Component, DestroyRef, ElementRef, afterRenderEffect, computed, effect, inject, input, linkedSignal, signal, untracked, viewChild } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { CategoryService } from '../../core/api/category.service';
import { WorkerService } from '../../core/api/worker.service';
import { CurrentUserService } from '../../core/session/current-user.service';
import { JobFilters, JobSort } from '../../../models/service.model';
import { todayBr } from '../../shared/utils/expiry';
import { RemoteData } from '../../shared/utils/remote-data';
import { Button } from '../../shared/ui/button';
import { CategoryChip } from '../../shared/ui/category-chip';
import { EmptyState } from '../../shared/ui/empty-state';
import { ErrorState } from '../../shared/ui/error-state';
import { Icon } from '../../shared/ui/icon';
import { ServiceCard } from '../../shared/ui/service-card';
import { Skeleton } from '../../shared/ui/skeleton';

const SEARCH_DELAY_MS = 350;

export const SORT_OPTIONS: { value: JobSort; label: string }[] = [
  { value: 'recent', label: 'Mais recentes' },
  { value: 'price_desc', label: 'Maior valor' },
  { value: 'price_asc', label: 'Menor valor' },
  { value: 'duration_asc', label: 'Menos horas' },
  { value: 'duration_desc', label: 'Mais horas' }
];

export const HOUR_PRESETS: { label: string; min: number | null; max: number | null }[] = [
  { label: 'Até 8 h', min: null, max: 8 },
  { label: '8 a 24 h', min: 8, max: 24 },
  { label: '24 a 40 h', min: 24, max: 40 },
  { label: '40 h ou mais', min: 40, max: null }
];

// "AAAA-MM-DD" de N dias atrás (horário de Brasília).
function daysAgo(days: number): string {
  return todayBr(new Date(Date.now() - days * 86_400_000));
}

function positiveOrNull(value: string | undefined): number | null {
  if (value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

// Vagas abertas com filtros. A URL é a fonte da verdade (?q=&categoria=&min=&max=&de=&ate=&ordem=):
// voltar do detalhe mantém a busca, e o link da busca pode ser compartilhado.
@Component({
  selector: 'app-jobs-page',
  imports: [Button, CategoryChip, EmptyState, ErrorState, Icon, ServiceCard, Skeleton],
  templateUrl: './jobs-page.html',
  styleUrl: './jobs-page.css'
})
export class JobsPage {
  // Query params (withComponentInputBinding).
  readonly buscar = input<string>(); // ?buscar=1 (botão central "Buscar"): foca o campo de busca
  readonly q = input<string>();
  readonly categoria = input<string>();
  readonly min = input<string>();
  readonly max = input<string>();
  readonly de = input<string>();
  readonly ate = input<string>();
  readonly ordem = input<string>();

  private readonly workerService = inject(WorkerService);
  private readonly categoryService = inject(CategoryService);
  private readonly currentUser = inject(CurrentUserService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly searchInput = viewChild.required<ElementRef<HTMLInputElement>>('searchInput');

  readonly sortOptions = SORT_OPTIONS;
  readonly hourPresets = HOUR_PRESETS;
  readonly today = todayBr();

  readonly filters = computed<JobFilters>(() => {
    const sort = SORT_OPTIONS.find((o) => o.value === this.ordem())?.value;
    return {
      q: this.q() || undefined,
      category: this.categoria() || undefined,
      min_hours: positiveOrNull(this.min()) ?? undefined,
      max_hours: positiveOrNull(this.max()) ?? undefined,
      from: this.de() || undefined,
      to: this.ate() || undefined,
      sort,
      worker_id: this.currentUser.user()?.role === 'worker' ? this.currentUser.user()?.id : undefined
    };
  });

  // Filtros além da busca e da categoria (mostrados no painel "Mais filtros").
  readonly extraCount = computed(() => {
    const f = this.filters();
    return [f.min_hours !== undefined || f.max_hours !== undefined, f.from || f.to, f.sort && f.sort !== 'recent'].filter(Boolean).length;
  });
  readonly anyFilter = computed(() => !!(this.filters().q || this.filters().category) || this.extraCount() > 0);
  readonly panelOpen = linkedSignal(() => this.extraCount() > 0);

  // Texto digitado; vai para a URL depois de uma pausa na digitação.
  readonly draftQuery = linkedSignal(() => this.q() ?? '');
  private searchTimer: ReturnType<typeof setTimeout> | undefined;

  readonly categories = new RemoteData(() => this.categoryService.getCategories());
  readonly jobs = new RemoteData(() => this.workerService.searchServices(this.filters()));

  constructor() {
    this.categories.load();
    inject(DestroyRef).onDestroy(() => clearTimeout(this.searchTimer));

    effect(() => {
      this.filters();
      untracked(() => this.jobs.load());
    });

    afterRenderEffect(() => {
      if (this.buscar()) this.searchInput().nativeElement.focus();
    });
  }

  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.draftQuery.set(value);
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => this.setParams({ q: value.trim() || null }), SEARCH_DELAY_MS);
  }

  selectCategory(category: string | null): void {
    this.setParams({ categoria: category });
  }

  isPreset(preset: (typeof HOUR_PRESETS)[number]): boolean {
    const f = this.filters();
    return (f.min_hours ?? null) === preset.min && (f.max_hours ?? null) === preset.max;
  }

  toggleHours(preset: (typeof HOUR_PRESETS)[number]): void {
    this.setParams(this.isPreset(preset) ? { min: null, max: null } : { min: preset.min, max: preset.max });
  }

  // Mínimo/máximo digitados. Se o mínimo passar do máximo, os dois são trocados.
  setHours(which: 'min' | 'max', event: Event): void {
    const value = positiveOrNull((event.target as HTMLInputElement).value);
    let min = which === 'min' ? value : (this.filters().min_hours ?? null);
    let max = which === 'max' ? value : (this.filters().max_hours ?? null);
    if (min !== null && max !== null && min > max) [min, max] = [max, min];
    this.setParams({ min, max });
  }

  setPeriod(days: number | null): void {
    this.setParams(days === null ? { de: null, ate: null } : { de: daysAgo(days), ate: null });
  }

  isPeriod(days: number): boolean {
    return this.de() === daysAgo(days) && !this.ate();
  }

  setDate(which: 'de' | 'ate', event: Event): void {
    const value = (event.target as HTMLInputElement).value || null;
    const next = { de: this.de() || null, ate: this.ate() || null, [which]: value };
    if (next.de && next.ate && next.de > next.ate) [next.de, next.ate] = [next.ate, next.de];
    this.setParams(next);
  }

  setSort(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.setParams({ ordem: value === 'recent' ? null : value });
  }

  clearFilters(): void {
    clearTimeout(this.searchTimer);
    this.draftQuery.set('');
    this.setParams({ q: null, categoria: null, min: null, max: null, de: null, ate: null, ordem: null });
  }

  private setParams(params: Params): void {
    this.router.navigate([], { relativeTo: this.route, queryParams: { ...params, buscar: null }, queryParamsHandling: 'merge', replaceUrl: true });
  }
}
