import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FarmerService } from '../../core/api/farmer.service';
import { CurrentUserService } from '../../core/session/current-user.service';
import { RemoteData } from '../../shared/utils/remote-data';
import { Button } from '../../shared/ui/button';
import { EmptyState } from '../../shared/ui/empty-state';
import { ErrorState } from '../../shared/ui/error-state';
import { Icon } from '../../shared/ui/icon';
import { Skeleton } from '../../shared/ui/skeleton';

@Component({
  selector: 'app-farms-page',
  imports: [RouterLink, Button, EmptyState, ErrorState, Icon, Skeleton],
  template: `
    <div class="container page">
      <div class="page-header">
        <div>
          <h1>Fazendas</h1>
        </div>
        <a appButton routerLink="/produtor/fazendas/nova"><app-icon name="plus" [size]="20" />Cadastrar fazenda</a>
      </div>

      @switch (farms.state().status) {
        @case ('loading') { <app-skeleton [count]="2" [height]="112" /> }
        @case ('error') { <app-error-state [message]="farms.error()" (retry)="farms.load()" /> }
        @case ('success') {
          @if (farms.data()?.length) {
            <ul class="grid-cards" role="list">
              @for (farm of farms.data(); track farm.id) {
                <li class="card farm">
                  <span class="icon"><app-icon name="farm" /></span>
                  <div>
                    <h2 class="t-h3">{{ farm.city }}, {{ farm.state }}</h2>
                    <p class="muted">{{ farm.address }}</p>
                  </div>
                </li>
              }
            </ul>
          } @else {
            <app-empty-state icon="farm" title="Nenhuma fazenda cadastrada" message="Cadastre sua fazenda para publicar serviços nela.">
              <a appButton routerLink="/produtor/fazendas/nova">Cadastrar fazenda</a>
            </app-empty-state>
          }
        }
      }
    </div>
  `,
  styles: `
    .farm { display: flex; gap: var(--space-4); align-items: flex-start; }
    .icon { display: grid; place-items: center; flex: none; width: 48px; height: 48px; border-radius: var(--radius-md); background: var(--broto-soft); }
  `
})
export class FarmsPage {
  private readonly farmerService = inject(FarmerService);
  private readonly farmerId = inject(CurrentUserService).requireId('farmer');

  readonly farms = new RemoteData(() => this.farmerService.getFarms(this.farmerId));

  constructor() {
    this.farms.load();
  }
}
