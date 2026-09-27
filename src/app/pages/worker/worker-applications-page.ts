import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { WorkerService } from '../../core/api/worker.service';
import { CurrentUserService } from '../../core/session/current-user.service';
import { RemoteData } from '../../shared/utils/remote-data';
import { formatBRL, formatDate } from '../../shared/utils/format';
import { Button } from '../../shared/ui/button';
import { EmptyState } from '../../shared/ui/empty-state';
import { ErrorState } from '../../shared/ui/error-state';
import { Icon } from '../../shared/ui/icon';
import { Skeleton } from '../../shared/ui/skeleton';
import { StatusBadge } from '../../shared/ui/status-badge';

@Component({
  selector: 'app-worker-applications-page',
  imports: [RouterLink, Button, EmptyState, ErrorState, Icon, Skeleton, StatusBadge],
  template: `
    <div class="container page">
      <div class="page-header">
        <div>
          <h1>Candidaturas</h1>
        </div>
      </div>

      @switch (applications.state().status) {
        @case ('loading') { <app-skeleton [count]="3" [height]="96" /> }
        @case ('error') { <app-error-state [message]="applications.error()" (retry)="applications.load()" /> }
        @case ('success') {
          @if (sorted().length) {
            <ul class="list" role="list">
              @for (application of sorted(); track application.id) {
                <li>
                  <a class="row" [routerLink]="['/trabalhador/vagas', application.service_id]">
                    <span class="what">
                      <span class="t-h3">{{ application.service.name }}</span>
                      <span class="t-body-sm muted meta">
                        <app-icon name="map-pin" [size]="16" />{{ application.service.farm.city }}, {{ application.service.farm.state }}
                      </span>
                      <span class="t-body-sm muted">{{ brl(application.service.price) }}, candidatura enviada em {{ date(application.insertion_date) }}</span>
                    </span>
                    <app-status-badge [status]="application.status" />
                  </a>
                </li>
              }
            </ul>
          } @else {
            <app-empty-state icon="list" title="Você ainda não se candidatou" message="Veja as vagas abertas e candidate-se às que combinam com você.">
              <a appButton routerLink="/trabalhador/vagas">Ver vagas</a>
            </app-empty-state>
          }
        }
      }
    </div>
  `,
  styles: `
    .list { display: grid; gap: var(--space-3); }
    .row {
      display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--space-3);
      padding: var(--space-4) var(--space-6); border-radius: var(--radius-lg);
      border: 1px solid var(--line); background: var(--surface-raised); box-shadow: var(--shadow-card);
      color: var(--ink); text-decoration: none;
    }
    .row:hover { border-color: var(--line-strong); }
    .what { display: grid; gap: var(--space-1); min-width: 0; }
    .meta { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-1); }
  `
})
export class WorkerApplicationsPage {
  private readonly workerService = inject(WorkerService);
  private readonly workerId = inject(CurrentUserService).requireId('worker');

  readonly applications = new RemoteData(() => this.workerService.getWorkerApplications(this.workerId));
  readonly sorted = computed(() => [...(this.applications.data() ?? [])].sort((a, b) => b.id - a.id));

  readonly brl = formatBRL;
  readonly date = formatDate;

  constructor() {
    this.applications.load();
  }
}
