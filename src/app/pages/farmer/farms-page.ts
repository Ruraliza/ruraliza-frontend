import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FarmerService } from '../../core/api/farmer.service';
import { CurrentUserService } from '../../core/session/current-user.service';
import { ToastService } from '../../core/toast/toast.service';
import { Farm } from '../../../models/farm.model';
import { RemoteData } from '../../shared/utils/remote-data';
import { Button } from '../../shared/ui/button';
import { ConfirmDialog } from '../../shared/ui/confirm-dialog';
import { EmptyState } from '../../shared/ui/empty-state';
import { ErrorState } from '../../shared/ui/error-state';
import { Icon } from '../../shared/ui/icon';
import { Skeleton } from '../../shared/ui/skeleton';

@Component({
  selector: 'app-farms-page',
  imports: [RouterLink, Button, ConfirmDialog, EmptyState, ErrorState, Icon, Skeleton],
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
                  <div class="body">
                    <div>
                      <h2 class="t-h3">{{ farm.city }}, {{ farm.state }}</h2>
                      <p class="muted">{{ farm.address }}</p>
                    </div>
                    <div class="cluster">
                      <a appButton variant="secondary" [routerLink]="['/produtor/fazendas', farm.id, 'editar']">Editar</a>
                      <button appButton variant="ghost" type="button" (click)="removing.set(farm)">Remover</button>
                    </div>
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

    <app-confirm-dialog
      [open]="removing() !== null"
      [title]="'Remover a fazenda em ' + (removing()?.city ?? '') + '?'"
      message="A fazenda sai da sua lista, mas o histórico de serviços concluídos ou cancelados nela é mantido. Se houver serviço aberto ou em andamento, cancele ou conclua antes."
      confirmLabel="Remover fazenda"
      confirmVariant="danger"
      [loading]="deleting()"
      (confirmed)="remove()"
      (cancelled)="removing.set(null)"
    />
  `,
  styles: `
    .farm { display: flex; gap: var(--space-4); align-items: flex-start; }
    .body { display: grid; gap: var(--space-4); min-width: 0; }
    .icon { display: grid; place-items: center; flex: none; width: 48px; height: 48px; border-radius: var(--radius-md); background: var(--broto-soft); }
  `
})
export class FarmsPage {
  private readonly farmerService = inject(FarmerService);
  private readonly farmerId = inject(CurrentUserService).requireId('farmer');
  private readonly toast = inject(ToastService);

  readonly farms = new RemoteData(() => this.farmerService.getFarms(this.farmerId));

  readonly removing = signal<Farm | null>(null);
  readonly deleting = signal(false);

  constructor() {
    this.farms.load();
  }

  remove(): void {
    const farm = this.removing();
    if (!farm) return;

    this.deleting.set(true);
    this.farmerService.deleteFarm(this.farmerId, farm.id).subscribe({
      next: () => {
        this.toast.success('Fazenda removida.');
        this.finish();
        this.farms.load();
      },
      error: () => this.finish() // a mensagem (ex.: serviço aberto) já saiu no toast
    });
  }

  private finish(): void {
    this.deleting.set(false);
    this.removing.set(null);
  }
}
