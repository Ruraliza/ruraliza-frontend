import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FarmerService } from '../../core/api/farmer.service';
import { CurrentUserService } from '../../core/session/current-user.service';
import { RemoteData } from '../../shared/utils/remote-data';
import { formatCpf, formatDate, formatPhone } from '../../shared/utils/format';
import { Button } from '../../shared/ui/button';
import { ErrorState } from '../../shared/ui/error-state';
import { Icon } from '../../shared/ui/icon';
import { Skeleton } from '../../shared/ui/skeleton';

// Perfil do produtor: somente leitura por enquanto.
@Component({
  selector: 'app-farmer-profile-page',
  imports: [Button, ErrorState, Icon, Skeleton],
  template: `
    <div class="container page">
      <div class="page-header">
        <div>
          <h1>{{ farmer.data()?.name ?? 'Perfil' }}</h1>
        </div>
      </div>

      @switch (farmer.state().status) {
        @case ('loading') { <app-skeleton [count]="1" [height]="200" /> }
        @case ('error') { <app-error-state [message]="farmer.error()" (retry)="farmer.load()" /> }
        @case ('success') {
          @if (farmer.data(); as f) {
            <section class="card">
              <dl class="details">
                <div><dt>E-mail</dt><dd>{{ f.email }}</dd></div>
                <div><dt>Telefone</dt><dd>{{ phone(f.phone) }}</dd></div>
                <div><dt>CPF</dt><dd>{{ cpf(f.cpf) }}</dd></div>
                <div><dt>Fazendas cadastradas</dt><dd>{{ f.farms }}</dd></div>
                <div><dt>No Ruraliza desde</dt><dd>{{ date(f.insertion_date) }}</dd></div>
              </dl>
            </section>
          }
        }
      }

      <div>
        <button appButton variant="secondary" type="button" (click)="switchProfile()"><app-icon name="logout" [size]="20" />Trocar perfil de teste</button>
      </div>
    </div>
  `
})
export class FarmerProfilePage {
  private readonly farmerService = inject(FarmerService);
  private readonly currentUser = inject(CurrentUserService);
  private readonly router = inject(Router);
  private readonly farmerId = this.currentUser.requireId('farmer');

  readonly farmer = new RemoteData(() => this.farmerService.getFarmer(this.farmerId));

  readonly phone = formatPhone;
  readonly cpf = formatCpf;
  readonly date = formatDate;

  constructor() {
    this.farmer.load();
  }

  switchProfile(): void {
    this.currentUser.clear();
    this.router.navigateByUrl('/entrar');
  }
}
