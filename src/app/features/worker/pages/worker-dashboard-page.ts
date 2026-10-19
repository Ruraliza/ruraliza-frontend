import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { WorkerService } from '../data-access/worker.service';
import { ProfileService } from '@core/api/profile.service';
import { CurrentUserService } from '@core/session/current-user.service';
import { RemoteData, mergeStates } from '@shared/utils/remote-data';
import { Button } from '@shared/ui/button';
import { ErrorState } from '@shared/ui/error-state';
import { Icon } from '@shared/ui/icon';
import { NextStep } from '@shared/domain/ui/next-step';
import { ServiceCard } from '@shared/domain/ui/service-card';
import { serviceCover } from '@shared/domain/utils/farm-emoji';
import { Skeleton } from '@shared/ui/skeleton';
import { PendingReviews } from '@shared/domain/ui/pending-reviews';
import { RecommendedJobs } from '../ui/recommended-jobs';
import { MatchingService } from '../data-access/matching.service';
import { SponsorSlot } from '@shared/domain/ui/sponsor-slot';

@Component({
  selector: 'app-worker-dashboard-page',
  imports: [RouterLink, Button, ErrorState, Icon, NextStep, PendingReviews, RecommendedJobs, ServiceCard, Skeleton, SponsorSlot],
  template: `
    <div class="container page">
      <h1>Olá{{ firstName() ? ', ' + firstName() : '' }}</h1>

      @switch (state().status) {
        @case ('loading') { <app-skeleton [count]="2" [height]="140" /> }
        @case ('error') { <app-error-state [message]="worker.error() || applications.error() || services.error()" (retry)="load()" /> }
        @case ('success') {
          <!-- Uma ação por vez: o serviço em andamento, ou as candidaturas que esperam resposta. -->
          @if (inProgress()[0]; as current) {
            <app-next-step
              status="Em andamento"
              [title]="current.name"
              [place]="current.farm.city + ', ' + current.farm.state"
              [photo]="cover(current)"
            >
              <a appButton [routerLink]="['/trabalhador/vagas', current.id]"><app-icon name="chat" [size]="20" />Abrir serviço e conversa</a>
            </app-next-step>
          } @else if (pendingCount()) {
            <app-next-step
              status="Aguardando resposta"
              [title]="pendingCount() === 1 ? '1 candidatura enviada' : pendingCount() + ' candidaturas enviadas'"
              place="O produtor vê seu perfil e decide quem faz o serviço."
            >
              <a appButton variant="secondary" routerLink="/trabalhador/candidaturas">Ver candidaturas</a>
            </app-next-step>
          }

          <app-recommended-jobs [workerId]="workerId" />

          <app-pending-reviews role="worker" [profileId]="workerId" />

          @if (inProgress().length > 1) {
            <section class="stack">
              <h2>Outros serviços em andamento</h2>
              <div class="grid-cards">
                @for (service of inProgress().slice(1); track service.id) {
                  <app-service-card [service]="service" [link]="['/trabalhador/vagas', service.id]" />
                }
              </div>
            </section>
          }

          @if (completedCount()) {
            <p class="muted">Você já concluiu {{ completedCount() }} {{ completedCount() === 1 ? 'serviço' : 'serviços' }} pelo Ruraliza.</p>
          }

          @if (interests.state().status !== 'loading') { <app-sponsor-slot audience="worker" [categories]="interests.data()?.categories ?? []" /> }
        }
      }
    </div>
  `
})
export class WorkerDashboardPage {
  private readonly workerService = inject(WorkerService);
  private readonly profiles = inject(ProfileService);
  readonly workerId = inject(CurrentUserService).requireId('worker');

  readonly worker = new RemoteData(() => this.profiles.getWorker(this.workerId));
  readonly applications = new RemoteData(() => this.workerService.getWorkerApplications(this.workerId));
  readonly services = new RemoteData(() => this.workerService.getWorkerServices(this.workerId));
  // Interesses: o patrocínio que combina (só as categorias vão na URL).
  private readonly matching = inject(MatchingService);
  readonly interests = new RemoteData(() => this.matching.preferences(this.workerId));
  readonly state = computed(() => mergeStates(this.worker.state(), this.applications.state(), this.services.state()));

  readonly firstName = computed(() => this.worker.data()?.name.split(' ')[0] ?? '');

  readonly inProgress = computed(() => (this.services.data() ?? []).filter((s) => s.status === 'In Progress'));
  readonly completedCount = computed(() => (this.services.data() ?? []).filter((s) => s.status === 'Completed').length);

  readonly pendingCount = computed(() => (this.applications.data() ?? []).filter((a) => a.status === 'Pending').length);
  protected readonly cover = serviceCover;

  constructor() {
    this.load();
  }

  load(): void {
    this.worker.load();
    this.applications.load();
    this.services.load();
    this.interests.load();
  }
}
