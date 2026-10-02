import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { Location } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { WorkerService } from '../../core/api/worker.service';
import { CurrentUserService } from '../../core/session/current-user.service';
import { ToastService } from '../../core/toast/toast.service';
import { RemoteData, mergeStates } from '../../shared/utils/remote-data';
import { expiryLabel, isExpired } from '../../shared/utils/expiry';
import { formatBRL, formatDate, formatHours } from '../../shared/utils/format';
import { Button } from '../../shared/ui/button';
import { CategoryChip } from '../../shared/ui/category-chip';
import { ConfirmDialog } from '../../shared/ui/confirm-dialog';
import { ErrorState } from '../../shared/ui/error-state';
import { FarmMap } from '../../shared/ui/farm-map';
import { pointOf } from '../../shared/utils/geocoding';
import { Icon } from '../../shared/ui/icon';
import { PhotoStrip } from '../../shared/ui/photo-strip';
import { Skeleton } from '../../shared/ui/skeleton';
import { StatusBadge } from '../../shared/ui/status-badge';

@Component({
  selector: 'app-job-detail-page',
  imports: [RouterLink, Button, CategoryChip, ConfirmDialog, ErrorState, FarmMap, Icon, PhotoStrip, Skeleton, StatusBadge],
  template: `
    <div class="container page">
      <a class="back-link" routerLink="/trabalhador/vagas" (click)="goBack($event)">← Vagas</a>

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

            @if (j.farm.photos.length) {
              <app-photo-strip [urls]="j.farm.photos" [label]="'Fotos da fazenda em ' + j.farm.city" />
            }

            <section class="card stack">
              @if (j.description) {
                <div class="description">
                  <h2 class="t-h3">Sobre o serviço</h2>
                  <p>{{ j.description }}</p>
                </div>
              }
              <dl class="details">
                <div><dt>Local</dt><dd class="with-icon"><app-icon name="map-pin" [size]="20" />{{ j.farm.city }}, {{ j.farm.state }}</dd></div>
                <div><dt>Duração</dt><dd>{{ hours() }}</dd></div>
                <div><dt>Pagamento</dt><dd class="price">{{ price() }}</dd></div>
                <div><dt>Publicada em</dt><dd>{{ publishedAt() }}</dd></div>
                @if (deadline(); as text) {
                  <div><dt>Prazo</dt><dd [class.deadline]="!expired()">{{ text }}</dd></div>
                }
              </dl>
              <!-- O ponto só vem da API para o trabalhador aceito no serviço. -->
              @if (farmPoint(); as point) {
                <div class="route">
                  <h2 class="t-h3">Como chegar</h2>
                  <app-farm-map [point]="point" [label]="'Fazenda em ' + j.farm.city" />
                </div>
              }
            </section>

            <section class="apply card" aria-live="polite">
              @if (myApplication(); as application) {
                <div>
                  <h2 class="t-h3">{{ withdrawKind() === 'service' ? 'O serviço é seu' : 'Você já se candidatou' }}</h2>
                  <p class="muted">Situação da sua candidatura:</p>
                  <app-status-badge [status]="application.status" />
                </div>
                @switch (withdrawKind()) {
                  @case ('application') {
                    <button appButton variant="secondary" type="button" (click)="confirmingWithdraw.set(true)">Cancelar candidatura</button>
                  }
                  @case ('service') {
                    <button appButton variant="danger" type="button" (click)="confirmingWithdraw.set(true)">Desistir do serviço</button>
                  }
                }
              } @else if (j.status !== 'Pending' || expired()) {
                <div>
                  <h2 class="t-h3">Vaga encerrada</h2>
                  <p class="muted">{{ expired() ? 'O prazo para se candidatar terminou.' : 'Esta vaga não está mais recebendo candidaturas.' }}</p>
                </div>
                <button appButton type="button" [disabled]="true">Candidatar-me</button>
              } @else {
                <div>
                  <h2 class="t-h3">Tem interesse?</h2>
                  <p class="muted">O produtor vê seu perfil e decide quem vai fazer o serviço.</p>
                </div>
                <button appButton type="button" (click)="confirmingApply.set(true)">Candidatar-me</button>
              }
            </section>
          }
        }
      }
    </div>

    <app-confirm-dialog
      [open]="confirmingApply()"
      title="Confirmar candidatura?"
      [message]="applyMessage()"
      confirmLabel="Confirmar candidatura"
      [loading]="applying()"
      (confirmed)="apply()"
      (cancelled)="confirmingApply.set(false)"
    />

    <app-confirm-dialog
      [open]="confirmingWithdraw()"
      [title]="withdrawKind() === 'service' ? 'Desistir do serviço?' : 'Cancelar candidatura?'"
      [message]="withdrawKind() === 'service'
        ? 'O serviço volta a ficar aberto e o produtor poderá escolher outra pessoa entre os candidatos.'
        : 'Sua candidatura será retirada. Se a vaga continuar aberta, você pode se candidatar de novo.'"
      [confirmLabel]="withdrawKind() === 'service' ? 'Desistir do serviço' : 'Cancelar candidatura'"
      confirmVariant="danger"
      [loading]="withdrawing()"
      (confirmed)="withdraw()"
      (cancelled)="confirmingWithdraw.set(false)"
    />
  `,
  styles: `
    .tags { margin-bottom: var(--space-2); }
    .price { font: 700 24px/30px var(--font-display); font-variant-numeric: tabular-nums; }
    .with-icon { display: flex; align-items: center; gap: var(--space-2); }
    .description { display: grid; gap: var(--space-2); padding-bottom: var(--space-4); border-bottom: 1px solid var(--line); }
    .description p { white-space: pre-line; max-width: 68ch; }
    .deadline { color: var(--orange-700); font-weight: 600; }
    .route { display: grid; gap: var(--space-2); padding-top: var(--space-4); border-top: 1px solid var(--line); }
    .apply { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--space-4); }
    .apply > div { display: grid; gap: var(--space-1); }
  `
})
export class JobDetailPage implements OnInit {
  readonly id = input.required<string>(); // parâmetro :id da rota

  private readonly workerService = inject(WorkerService);
  private readonly workerId = inject(CurrentUserService).requireId('worker');
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly location = inject(Location);

  private readonly serviceId = computed(() => Number(this.id()));

  readonly job = new RemoteData(() => this.workerService.getOpenService(this.serviceId(), this.workerId));
  readonly applications = new RemoteData(() => this.workerService.getWorkerApplications(this.workerId));
  readonly state = computed(() => mergeStates(this.job.state(), this.applications.state()));

  readonly myApplication = computed(
    () => this.applications.data()?.find((a) => a.service_id === this.serviceId()) ?? null
  );
  readonly farmPoint = computed(() => {
    const job = this.job.data();
    return job ? pointOf(job.farm) : null;
  });
  readonly price = computed(() => formatBRL(this.job.data()?.price ?? 0));
  readonly hours = computed(() => formatHours(this.job.data()?.duration ?? 0));
  readonly publishedAt = computed(() => {
    const job = this.job.data();
    return job ? formatDate(job.insertion_date) : '';
  });

  readonly expired = computed(() => {
    const job = this.job.data();
    return job ? isExpired(job) : false;
  });
  readonly deadline = computed(() => {
    const job = this.job.data();
    return job ? expiryLabel(job) : null;
  });

  // Resumo do que a pessoa está confirmando.
  readonly applyMessage = computed(() => {
    const job = this.job.data();
    if (!job) return '';
    return `${job.name} em ${job.farm.city}, ${job.farm.state}: ${this.hours()} por ${this.price()}. ` +
      'O produtor verá seu perfil (foto, apresentação, experiência, certificados e cursos). ' +
      'Enquanto a candidatura estiver aguardando, você pode cancelá-la.';
  });

  readonly confirmingApply = signal(false);
  readonly applying = signal(false);
  readonly confirmingWithdraw = signal(false);
  readonly withdrawing = signal(false);

  // O que "desistir" significa agora: retirar a candidatura ou largar o serviço já aceito.
  readonly withdrawKind = computed<'application' | 'service' | null>(() => {
    const application = this.myApplication();
    const job = this.job.data();
    if (!application || !job) return null;
    if (application.status === 'Pending' && job.status === 'Pending') return 'application';
    if (application.status === 'Accepted' && job.status === 'In Progress') return 'service';
    return null;
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.job.load();
    this.applications.load();
  }

  // Depois de uma ação: atualiza sem desmontar a tela (e o mapa da fazenda).
  private refresh(): void {
    this.job.refresh();
    this.applications.refresh();
  }

  apply(): void {
    this.applying.set(true);
    this.workerService.applyForService(this.serviceId(), this.workerId).subscribe({
      next: () => {
        this.applying.set(false);
        this.confirmingApply.set(false);
        this.toast.success('Candidatura enviada! Agora é aguardar a resposta do produtor.');
        this.applications.refresh();
      },
      error: () => {
        // A mensagem (ex.: prazo encerrado) já saiu no toast; recarrega para mostrar o estado atual.
        this.applying.set(false);
        this.confirmingApply.set(false);
        this.refresh();
      }
    });
  }

  // Veio da lista de vagas: volta pelo histórico, mantendo busca e filtros.
  goBack(event: Event): void {
    if (this.router.lastSuccessfulNavigation()?.previousNavigation) {
      event.preventDefault();
      this.location.back();
    }
  }

  withdraw(): void {
    const kind = this.withdrawKind();
    this.withdrawing.set(true);
    this.workerService.withdrawFromService(this.serviceId(), this.workerId).subscribe({
      next: () => {
        this.withdrawing.set(false);
        this.confirmingWithdraw.set(false);
        this.toast.success(kind === 'service' ? 'Você desistiu do serviço. Ele voltou a ficar aberto.' : 'Candidatura cancelada.');
        this.refresh();
      },
      error: () => {
        this.withdrawing.set(false);
        this.confirmingWithdraw.set(false);
      }
    });
  }
}
