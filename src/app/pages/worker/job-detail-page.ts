import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { WorkerService } from '../../core/api/worker.service';
import { CurrentUserService } from '../../core/session/current-user.service';
import { ToastService } from '../../core/toast/toast.service';
import { RemoteData, mergeStates } from '../../shared/utils/remote-data';
import { formatBRL, formatDate, formatHours } from '../../shared/utils/format';
import { Button } from '../../shared/ui/button';
import { CategoryChip } from '../../shared/ui/category-chip';
import { ErrorState } from '../../shared/ui/error-state';
import { Icon } from '../../shared/ui/icon';
import { Skeleton } from '../../shared/ui/skeleton';
import { StatusBadge } from '../../shared/ui/status-badge';

@Component({
  selector: 'app-job-detail-page',
  imports: [RouterLink, Button, CategoryChip, ErrorState, Icon, Skeleton, StatusBadge],
  template: `
    <div class="container page">
      <a class="back-link" routerLink="/trabalhador/vagas">← Vagas</a>

      @switch (state().status) {
        @case ('loading') { <app-skeleton [count]="1" [height]="280" /> }
        @case ('error') { <app-error-state [message]="job.error() || applications.error()" (retry)="load()" /> }
        @case ('success') {
          @if (job.data(); as j) {
            <header class="page-header">
              <div>
                <div class="cluster tags">
                  <span appCategoryChip>{{ j.category }}</span>
                  @if (j.status !== 'Pending') { <app-status-badge [status]="j.status" /> }
                </div>
                <h1>{{ j.name }}</h1>
              </div>
            </header>

            <section class="card stack">
              <dl class="details">
                <div><dt>Local</dt><dd class="with-icon"><app-icon name="map-pin" [size]="20" />{{ j.farm.city }}, {{ j.farm.state }}</dd></div>
                <div><dt>Duração</dt><dd>{{ hours() }}</dd></div>
                <div><dt>Pagamento</dt><dd class="price">{{ price() }}</dd></div>
                <div><dt>Publicada em</dt><dd>{{ publishedAt() }}</dd></div>
              </dl>
            </section>

            <section class="apply card" aria-live="polite">
              @if (myApplication(); as application) {
                <div>
                  <h2 class="t-h3">Você já se candidatou</h2>
                  <p class="muted">Situação da sua candidatura:</p>
                </div>
                <app-status-badge [status]="application.status" />
              } @else if (j.status !== 'Pending') {
                <div>
                  <h2 class="t-h3">Vaga encerrada</h2>
                  <p class="muted">Esta vaga não está mais recebendo candidaturas.</p>
                </div>
                <button appButton type="button" [disabled]="true">Candidatar-me</button>
              } @else {
                <div>
                  <h2 class="t-h3">Tem interesse?</h2>
                  <p class="muted">O produtor vê seu perfil e decide quem vai fazer o serviço.</p>
                </div>
                <button appButton type="button" [loading]="applying()" (click)="apply()">Candidatar-me</button>
              }
            </section>
          }
        }
      }
    </div>
  `,
  styles: `
    .tags { margin-bottom: var(--space-2); }
    .price { font: 700 24px/30px var(--font-display); font-variant-numeric: tabular-nums; }
    .with-icon { display: flex; align-items: center; gap: var(--space-2); }
    .apply { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--space-4); }
    .apply > div { display: grid; gap: var(--space-1); }
  `
})
export class JobDetailPage implements OnInit {
  readonly id = input.required<string>(); // parâmetro :id da rota

  private readonly workerService = inject(WorkerService);
  private readonly workerId = inject(CurrentUserService).requireId('worker');
  private readonly toast = inject(ToastService);

  private readonly serviceId = computed(() => Number(this.id()));

  readonly job = new RemoteData(() => this.workerService.getOpenService(this.serviceId()));
  readonly applications = new RemoteData(() => this.workerService.getWorkerApplications(this.workerId));
  readonly state = computed(() => mergeStates(this.job.state(), this.applications.state()));

  readonly myApplication = computed(
    () => this.applications.data()?.find((a) => a.service_id === this.serviceId()) ?? null
  );
  readonly price = computed(() => formatBRL(this.job.data()?.price ?? 0));
  readonly hours = computed(() => formatHours(this.job.data()?.duration ?? 0));
  readonly publishedAt = computed(() => {
    const job = this.job.data();
    return job ? formatDate(job.insertion_date) : '';
  });

  readonly applying = signal(false);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.job.load();
    this.applications.load();
  }

  apply(): void {
    this.applying.set(true);
    this.workerService.applyForService(this.serviceId(), this.workerId).subscribe({
      next: () => {
        this.applying.set(false);
        this.toast.success('Candidatura enviada! Agora é aguardar a resposta do produtor.');
        this.applications.load();
      },
      error: () => this.applying.set(false)
    });
  }
}
