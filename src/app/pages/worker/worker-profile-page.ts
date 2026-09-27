import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { WorkerService } from '../../core/api/worker.service';
import { CurrentUserService } from '../../core/session/current-user.service';
import { RemoteData } from '../../shared/utils/remote-data';
import { formatCpf, formatDate, formatPhone } from '../../shared/utils/format';
import { Button } from '../../shared/ui/button';
import { ErrorState } from '../../shared/ui/error-state';
import { Icon } from '../../shared/ui/icon';
import { Skeleton } from '../../shared/ui/skeleton';

// Perfil do trabalhador: somente leitura por enquanto.
@Component({
  selector: 'app-worker-profile-page',
  imports: [Button, ErrorState, Icon, Skeleton],
  template: `
    <div class="container page">
      <div class="page-header">
        <div>
          <h1>{{ worker.data()?.name ?? 'Perfil' }}</h1>
        </div>
      </div>

      @switch (worker.state().status) {
        @case ('loading') { <app-skeleton [count]="1" [height]="200" /> }
        @case ('error') { <app-error-state [message]="worker.error()" (retry)="worker.load()" /> }
        @case ('success') {
          @if (worker.data(); as w) {
            <section class="card">
              <dl class="details">
                <div><dt>E-mail</dt><dd>{{ w.email }}</dd></div>
                <div><dt>Telefone</dt><dd>{{ phone(w.phone) }}</dd></div>
                <div><dt>CPF</dt><dd>{{ cpf(w.cpf) }}</dd></div>
                <div><dt>Experiência</dt><dd>{{ w.experience || 'Não informada' }}</dd></div>
                <div><dt>Certificados</dt><dd>{{ w.certificates || 'Nenhum informado' }}</dd></div>
                <div><dt>No Ruraliza desde</dt><dd>{{ date(w.insertion_date) }}</dd></div>
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
export class WorkerProfilePage {
  private readonly workerService = inject(WorkerService);
  private readonly currentUser = inject(CurrentUserService);
  private readonly router = inject(Router);
  private readonly workerId = this.currentUser.requireId('worker');

  readonly worker = new RemoteData(() => this.workerService.getWorker(this.workerId));

  readonly phone = formatPhone;
  readonly cpf = formatCpf;
  readonly date = formatDate;

  constructor() {
    this.worker.load();
  }

  switchProfile(): void {
    this.currentUser.clear();
    this.router.navigateByUrl('/entrar');
  }
}
