import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FarmerService } from '../../core/api/farmer.service';
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
  selector: 'app-farmer-dashboard-page',
  imports: [RouterLink, Button, EmptyState, ErrorState, Icon, MetricCard, ServiceCard, Skeleton],
  template: `
    <div class="container page">
      <div class="page-header">
        <div>
          <h1>Olá{{ firstName() ? ', ' + firstName() : '' }}</h1>
        </div>
        <a appButton routerLink="/produtor/servicos/novo"><app-icon name="plus" [size]="20" />Publicar serviço</a>
      </div>

      @switch (state().status) {
        @case ('loading') { <app-skeleton [count]="2" [height]="140" /> }
        @case ('error') { <app-error-state [message]="services.error() || farmer.error()" (retry)="load()" /> }
        @case ('success') {
          @if (metrics(); as m) {
            <section class="grid-metrics" aria-label="Resumo">
              <app-metric-card variant="hero" label="Candidaturas para analisar" [value]="m.pendingApplications" />
              <app-metric-card label="Abertos" [value]="m.open" />
              <app-metric-card label="Em andamento" [value]="m.inProgress" />
              <app-metric-card label="Concluídos" [value]="m.completed" />
            </section>
          }

          <section class="stack">
            <div class="page-header">
              <h2>Serviços recentes</h2>
              @if (recent().length) { <a appButton variant="ghost" routerLink="/produtor/servicos">Ver todos</a> }
            </div>
            @if (recent().length) {
              <div class="grid-cards">
                @for (service of recent(); track service.id) {
                  <app-service-card [service]="service" [link]="['/produtor/servicos', service.id]" />
                }
              </div>
            } @else {
              <app-empty-state title="Você ainda não publicou serviços" message="Publique o primeiro e receba candidaturas de quem sabe fazer.">
                <a appButton routerLink="/produtor/servicos/novo">Publicar serviço</a>
              </app-empty-state>
            }
          </section>
        }
      }
    </div>
  `
})
export class FarmerDashboardPage {
  private readonly farmerService = inject(FarmerService);
  private readonly farmerId = inject(CurrentUserService).requireId('farmer');

  readonly farmer = new RemoteData(() => this.farmerService.getFarmer(this.farmerId));
  readonly services = new RemoteData(() => this.farmerService.getFarmerServices(this.farmerId));
  readonly state = computed(() => mergeStates(this.farmer.state(), this.services.state()));

  readonly firstName = computed(() => this.farmer.data()?.name.split(' ')[0] ?? '');

  readonly metrics = computed(() => {
    const list = this.services.data();
    if (!list) return null;
    return {
      open: list.filter((s) => s.status === 'Pending').length,
      inProgress: list.filter((s) => s.status === 'In Progress').length,
      completed: list.filter((s) => s.status === 'Completed').length,
      pendingApplications: list.reduce((sum, s) => sum + s.applications_pending, 0)
    };
  });

  readonly recent = computed(() => [...(this.services.data() ?? [])].sort((a, b) => b.id - a.id).slice(0, 3));

  constructor() {
    this.load();
  }

  load(): void {
    this.farmer.load();
    this.services.load();
  }
}
