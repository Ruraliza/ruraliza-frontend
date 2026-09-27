import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FarmerService } from '../../core/api/farmer.service';
import { CurrentUserService } from '../../core/session/current-user.service';
import { ServiceStatus } from '../../../models/status';
import { RemoteData } from '../../shared/utils/remote-data';
import { Button } from '../../shared/ui/button';
import { EmptyState } from '../../shared/ui/empty-state';
import { ErrorState } from '../../shared/ui/error-state';
import { Icon } from '../../shared/ui/icon';
import { SegmentOption, SegmentedControl } from '../../shared/ui/segmented-control';
import { ServiceCard } from '../../shared/ui/service-card';
import { Skeleton } from '../../shared/ui/skeleton';

type ServiceTab = Extract<ServiceStatus, 'Pending' | 'In Progress' | 'Completed'>;

const EMPTY_COPY: Record<ServiceTab, { title: string; message: string }> = {
  Pending: { title: 'Nenhum serviço aberto', message: 'Publique um serviço para começar a receber candidaturas.' },
  'In Progress': { title: 'Nenhum serviço em andamento', message: 'Quando você aceitar um trabalhador, o serviço aparece aqui.' },
  Completed: { title: 'Nenhum serviço concluído ainda', message: 'Serviços com pagamento liberado aparecem aqui.' }
};

@Component({
  selector: 'app-farmer-services-page',
  imports: [RouterLink, Button, EmptyState, ErrorState, Icon, SegmentedControl, ServiceCard, Skeleton],
  template: `
    <div class="container page">
      <div class="page-header">
        <div>
          <h1>Serviços</h1>
        </div>
        <a appButton routerLink="/produtor/servicos/novo"><app-icon name="plus" [size]="20" />Publicar serviço</a>
      </div>

      <app-segmented-control label="Filtrar serviços por situação" [options]="tabs" [(value)]="status" />

      @switch (services.state().status) {
        @case ('loading') { <app-skeleton [count]="3" [height]="180" /> }
        @case ('error') { <app-error-state [message]="services.error()" (retry)="services.load()" /> }
        @case ('success') {
          @if (services.data()?.length) {
            <div class="grid-cards">
              @for (service of services.data(); track service.id) {
                <app-service-card [service]="service" [link]="['/produtor/servicos', service.id]" />
              }
            </div>
          } @else {
            <app-empty-state [title]="emptyCopy().title" [message]="emptyCopy().message">
              @if (status() === 'Pending') { <a appButton routerLink="/produtor/servicos/novo">Publicar serviço</a> }
            </app-empty-state>
          }
        }
      }
    </div>
  `
})
export class FarmerServicesPage {
  private readonly farmerService = inject(FarmerService);
  private readonly farmerId = inject(CurrentUserService).requireId('farmer');

  readonly tabs: SegmentOption<ServiceTab>[] = [
    { value: 'Pending', label: 'Abertos' },
    { value: 'In Progress', label: 'Em andamento' },
    { value: 'Completed', label: 'Concluídos' }
  ];
  readonly status = signal<ServiceTab>('Pending');
  readonly emptyCopy = computed(() => EMPTY_COPY[this.status()]);

  readonly services = new RemoteData(() => this.farmerService.getFarmerServices(this.farmerId, this.status()));

  constructor() {
    // Recarrega a lista quando a aba muda.
    effect(() => {
      this.status();
      untracked(() => this.services.load());
    });
  }
}
