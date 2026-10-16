import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatchingService } from '../data-access/matching.service';
import { CurrentUserService } from '@core/session/current-user.service';
import { Button } from '@shared/ui/button';
import { EmptyState } from '@shared/ui/empty-state';
import { ErrorState } from '@shared/ui/error-state';
import { ServiceCard } from '@shared/domain/ui/service-card';
import { Skeleton } from '@shared/ui/skeleton';
import { RemoteData } from '@shared/utils/remote-data';

// Todas as vagas para você (/trabalhador/vagas/para-voce), da que mais combina para a que menos.
@Component({
  selector: 'app-recommended-jobs-page',
  imports: [RouterLink, Button, EmptyState, ErrorState, ServiceCard, Skeleton],
  template: `
    <div class="container page">
      <a class="back-link" routerLink="/trabalhador">← Início</a>
      <div class="page-header">
        <div>
          <h1>Vagas para você</h1>
          <p class="muted">Da que mais combina para a que menos, pelo que você escolheu, pelas trilhas que faz e pelas vagas em que se candidatou.</p>
        </div>
        <a appButton variant="secondary" routerLink="/trabalhador/perfil" fragment="interesses">Ajustar interesses</a>
      </div>

      @switch (jobs.state().status) {
        @case ('loading') { <app-skeleton [count]="3" [height]="160" /> }
        @case ('error') { <app-error-state [message]="jobs.error()" (retry)="jobs.load()" /> }
        @case ('success') {
          @if (jobs.data()?.length) {
            <div class="grid-cards">
              @for (job of jobs.data(); track job.id) {
                <app-service-card [service]="job" [link]="['/trabalhador/vagas', job.id]" [showStatus]="false" [reasons]="job.reasons" />
              }
            </div>
          } @else {
            <app-empty-state icon="search" title="Nenhuma vaga combina agora" message="Ajuste seus interesses ou veja todas as vagas abertas.">
              <a appButton routerLink="/trabalhador/vagas">Ver vagas abertas</a>
            </app-empty-state>
          }
        }
      }
    </div>
  `
})
export class RecommendedJobsPage {
  private readonly matching = inject(MatchingService);
  private readonly workerId = inject(CurrentUserService).requireId('worker');

  readonly jobs = new RemoteData(() => this.matching.recommended(this.workerId, 30));

  constructor() {
    this.jobs.load();
  }
}
