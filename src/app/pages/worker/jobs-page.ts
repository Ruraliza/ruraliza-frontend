import { Component, ElementRef, afterRenderEffect, computed, effect, inject, input, signal, untracked, viewChild } from '@angular/core';
import { CategoryService } from '../../core/api/category.service';
import { WorkerService } from '../../core/api/worker.service';
import { RemoteData } from '../../shared/utils/remote-data';
import { Button } from '../../shared/ui/button';
import { CategoryChip } from '../../shared/ui/category-chip';
import { EmptyState } from '../../shared/ui/empty-state';
import { ErrorState } from '../../shared/ui/error-state';
import { Icon } from '../../shared/ui/icon';
import { ServiceCard } from '../../shared/ui/service-card';
import { Skeleton } from '../../shared/ui/skeleton';

function normalize(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

// Vagas abertas: filtro por categoria (na API) e busca por texto (na tela).
@Component({
  selector: 'app-jobs-page',
  imports: [Button, CategoryChip, EmptyState, ErrorState, Icon, ServiceCard, Skeleton],
  templateUrl: './jobs-page.html',
  styleUrl: './jobs-page.css'
})
export class JobsPage {
  // ?buscar=1 (botão central "Buscar"): foca o campo de busca.
  readonly buscar = input<string>();

  private readonly workerService = inject(WorkerService);
  private readonly categoryService = inject(CategoryService);
  private readonly searchInput = viewChild.required<ElementRef<HTMLInputElement>>('searchInput');

  readonly category = signal<string | null>(null);
  readonly query = signal('');

  readonly categories = new RemoteData(() => this.categoryService.getCategories());
  readonly jobs = new RemoteData(() => this.workerService.searchServices(this.category() ?? undefined));

  readonly filtered = computed(() => {
    const list = this.jobs.data() ?? [];
    const term = normalize(this.query().trim());
    if (!term) return list;
    return list.filter((job) => normalize(`${job.name} ${job.category} ${job.farm.city} ${job.farm.state}`).includes(term));
  });

  constructor() {
    this.categories.load();

    effect(() => {
      this.category();
      untracked(() => this.jobs.load());
    });

    afterRenderEffect(() => {
      if (this.buscar()) this.searchInput().nativeElement.focus();
    });
  }

  selectCategory(category: string | null): void {
    this.category.set(category);
  }

  onSearch(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
  }

  clearFilters(): void {
    this.query.set('');
    this.category.set(null);
  }
}
