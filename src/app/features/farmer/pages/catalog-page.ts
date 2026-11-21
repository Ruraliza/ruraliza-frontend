import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CatalogWorker } from '@core/models/matching.model';
import { ToastService } from '@core/toast/toast.service';
import { Avatar } from '@shared/domain/ui/avatar';
import { CategoryChip } from '@shared/domain/ui/category-chip';
import { RatingBadge } from '@shared/domain/ui/rating-badge';
import { VerifiedBadge } from '@shared/domain/ui/verified-badge';
import { Button } from '@shared/ui/button';
import { EmptyState } from '@shared/ui/empty-state';
import { ErrorState } from '@shared/ui/error-state';
import { Icon } from '@shared/ui/icon';
import { Skeleton } from '@shared/ui/skeleton';
import { RemoteData, mergeStates } from '@shared/utils/remote-data';
import { FarmerService } from '../data-access/farmer.service';

// Catálogo de prestadores da vaga (aberta e no prazo): quem escolheu a categoria e deixou o catálogo ligado,
// com os motivos. "Convidar" manda o convite e vira "Convidado". Aparece logo depois de publicar a vaga e
// pelo detalhe dela.
@Component({
  selector: 'app-catalog-page',
  imports: [RouterLink, Avatar, Button, CategoryChip, EmptyState, ErrorState, Icon, RatingBadge, Skeleton, VerifiedBadge],
  template: `
    <div class="container page">
      <a class="back-link" [routerLink]="serviceLink()">← Voltar para a vaga</a>

      @switch (state().status) {
        @case ('loading') { <app-skeleton [count]="3" [height]="160" /> }
        @case ('error') {
          <app-error-state [message]="catalog.error() || service.error()" (retry)="load()" />
        }
        @case ('success') {
          <header class="page-header">
            <div>
              @if (service.data(); as s) { <div class="cluster"><span appCategoryChip>{{ s.category }}</span></div> }
              <h1>Quem pode fazer este serviço</h1>
              <p class="muted">Pessoas que escolheram este tipo de serviço e aceitaram aparecer para produtores. Convide quem combina: o convite chega no celular delas.</p>
            </div>
          </header>

          @if (catalog.data()?.length) {
            <ul class="grid-cards" role="list">
              @for (worker of catalog.data(); track worker.id) {
                <li class="card">
                  <div class="head">
                    <app-avatar [name]="worker.name" [photoUrl]="worker.photo_url" [size]="56" />
                    <div class="who">
                      <h2 class="t-h3">{{ worker.name }}</h2>
                      <div class="badges">
                        <app-rating-badge [reputation]="worker.reputation" />
                        @if (worker.verified) { <app-verified-badge /> }
                      </div>
                    </div>
                  </div>
                  <ul class="reasons" role="list" aria-label="Por que esta pessoa aparece">
                    @for (reason of worker.reasons; track reason) { <li><app-icon name="check" [size]="16" />{{ reason }}</li> }
                  </ul>
                  @if (worker.bio; as bio) { <p class="bio">{{ bio }}</p> }
                  <dl class="details">
                    <div><dt>Experiência</dt><dd>{{ worker.experience || 'Não informada' }}</dd></div>
                    <div><dt>Certificados</dt><dd>{{ worker.certificates || 'Nenhum informado' }}</dd></div>
                  </dl>
                  @if (invited().has(worker.id)) {
                    <button appButton variant="secondary" type="button" [disabled]="true"><app-icon name="check" [size]="20" />Convidado</button>
                  } @else {
                    <button appButton type="button" [disabled]="sending() === worker.id" (click)="invite(worker)">
                      <app-icon name="send" [size]="20" />{{ sending() === worker.id ? 'Convidando…' : 'Convidar' }}
                    </button>
                  }
                </li>
              }
            </ul>
          } @else {
            <app-empty-state [art]="true" [title]="emptyTitle()" message="Quando alguém escolher este serviço e estiver perto da sua fazenda, a pessoa aparece aqui. As candidaturas continuam chegando normalmente.">
              <a appButton variant="secondary" [routerLink]="serviceLink()">Voltar para a vaga</a>
            </app-empty-state>
          }
        }
      }
    </div>
  `,
  styles: `
    .card {
      display: grid; gap: var(--space-4); align-content: start; padding: var(--space-6);
      background: var(--surface-raised); border: 1px solid var(--line); border-radius: var(--radius-lg); box-shadow: var(--shadow-card);
    }
    .head { display: flex; align-items: center; gap: var(--space-3); }
    .who { display: grid; gap: var(--space-1); min-width: 0; }
    .who h2 { margin: 0; overflow-wrap: anywhere; }
    .badges { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-2); }
    .reasons { display: grid; gap: var(--space-1); margin: 0; padding: 0; list-style: none; }
    .reasons li { display: flex; align-items: flex-start; gap: var(--space-2); color: var(--ink); }
    .reasons app-icon { flex: none; margin-top: 3px; color: var(--mata); }
    .bio { margin: 0; white-space: pre-line; }
    dd { white-space: pre-line; }
  `
})
export class CatalogPage implements OnInit {
  readonly id = input.required<string>(); // parâmetro :id da rota

  private readonly farmerService = inject(FarmerService);
  private readonly toast = inject(ToastService);
  private readonly serviceId = computed(() => Number(this.id()));

  readonly service = new RemoteData(() => this.farmerService.getService(this.serviceId()));
  readonly catalog = new RemoteData(() => this.farmerService.getCatalog(this.serviceId()));
  readonly state = computed(() => mergeStates(this.service.state(), this.catalog.state()));
  readonly serviceLink = computed(() => ['/produtor/servicos', this.serviceId()]);
  readonly emptyTitle = computed(() => `Ninguém com interesse em ${this.service.data()?.category ?? 'este serviço'} perto da sua fazenda ainda`);

  readonly invited = signal<ReadonlySet<number>>(new Set());
  readonly sending = signal<number | null>(null);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.service.load();
    this.catalog.load();
  }

  invite(worker: CatalogWorker): void {
    this.sending.set(worker.id);
    this.farmerService.invite(this.serviceId(), worker.id).subscribe({
      next: () => {
        this.sending.set(null);
        this.invited.update((ids) => new Set([...ids, worker.id]));
        this.toast.success(`Convite enviado para ${worker.name.split(' ')[0] ?? worker.name}.`);
      },
      // O erro (ex.: a pessoa saiu do catálogo) aparece no aviso padrão de erro da API.
      error: () => this.sending.set(null)
    });
  }
}
