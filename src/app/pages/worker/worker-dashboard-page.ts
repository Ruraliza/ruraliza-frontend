import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { WorkerService } from '../../core/api/worker.service';
import { CurrentUserService } from '../../core/session/current-user.service';
import { RemoteData, mergeStates } from '../../shared/utils/remote-data';
import { Button } from '../../shared/ui/button';
import { EmptyState } from '../../shared/ui/empty-state';
import { ErrorState } from '../../shared/ui/error-state';
import { Icon } from '../../shared/ui/icon';
import { MetricCard } from '../../shared/ui/metric-card';
import { ServiceCard } from '../../shared/ui/service-card';
import { Skeleton } from '../../shared/ui/skeleton';

@Component({
  selector: 'app-worker-dashboard-page',
  imports: [RouterLink, Button, EmptyState, ErrorState, Icon, MetricCard, ServiceCard, Skeleton],
  template: `
    <div class="container page">
      <div class="page-header">
        <div>
          <h1>Olá{{ firstName() ? ', ' + firstName() : '' }}</h1>
        </div>
        <a appButton routerLink="/trabalhador/vagas"><app-icon name="search" [size]="20" />Buscar vagas</a>
      </div>

      @switch (state().status) {
        @case ('loading') { <app-skeleton [count]="2" [height]="140" /> }
        @case ('error') { <app-error-state [message]="worker.error() || applications.error() || services.error()" (retry)="load()" /> }
        @case ('success') {
          @if (metrics(); as m) {
            <section class="grid-metrics" aria-label="Resumo">
              <app-metric-card variant="hero" label="Serviços em andamento" [value]="m.inProgress" />
              <app-metric-card label="Candidaturas aguardando" [value]="m.pending" />
              <app-metric-card label="Candidaturas aceitas" [value]="m.accepted" />
              <app-metric-card label="Candidaturas recusadas" [value]="m.rejected" />
            </section>
          }

          <section class="stack">
            <h2>Em andamento</h2>
            @if (inProgress().length) {
              <div class="grid-cards">
                @for (service of inProgress(); track service.id) {
                  <app-service-card [service]="service" [link]="['/trabalhador/vagas', service.id]" />
                }
              </div>
            } @else {
              <app-empty-state icon="briefcase" title="Nenhum serviço em andamento" message="Quando um produtor aceitar sua candidatura, o serviço aparece aqui.">
                <a appButton routerLink="/trabalhador/vagas">Ver vagas abertas</a>
              </app-empty-state>
            }
          </section>

          @if (completedCount()) {
            <p class="muted">Você já concluiu {{ completedCount() }} {{ completedCount() === 1 ? 'serviço' : 'serviços' }} pelo Ruraliza.</p>
          }
        }
      }
    </div>
  `
})
export class WorkerDashboardPage {
  private readonly workerService = inject(WorkerService);
  private readonly workerId = inject(CurrentUserService).requireId('worker');

  readonly worker = new RemoteData(() => this.workerService.getWorker(this.workerId));
  readonly applications = new RemoteData(() => this.workerService.getWorkerApplications(this.workerId));
  readonly services = new RemoteData(() => this.workerService.getWorkerServices(this.workerId));
  readonly state = computed(() => mergeStates(this.worker.state(), this.applications.state(), this.services.state()));

  readonly firstName = computed(() => this.worker.data()?.name.split(' ')[0] ?? '');

  readonly inProgress = computed(() => (this.services.data() ?? []).filter((s) => s.status === 'In Progress'));
  readonly completedCount = computed(() => (this.services.data() ?? []).filter((s) => s.status === 'Completed').length);

  readonly metrics = computed(() => {
    const apps = this.applications.data();
    if (!apps) return null;
    return {
      inProgress: this.inProgress().length,
      pending: apps.filter((a) => a.status === 'Pending').length,
      accepted: apps.filter((a) => a.status === 'Accepted').length,
      rejected: apps.filter((a) => a.status === 'Rejected').length
    };
  });

  constructor() {
    this.load();
  }

  load(): void {
    this.worker.load();
    this.applications.load();
    this.services.load();
  }
}
