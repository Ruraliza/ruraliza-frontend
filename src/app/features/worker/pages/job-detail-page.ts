import { Component, DestroyRef, OnInit, computed, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Location } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { WorkerService } from '../data-access/worker.service';
import { ChatInboxService } from '@core/api/chat-inbox.service';
import { LiveUpdatesService } from '@core/api/live-updates.service';
import { CurrentUserService } from '@core/session/current-user.service';
import { RoleSwitchService } from '@core/session/role-switch.service';
import { ToastService } from '@core/toast/toast.service';
import { RemoteData, mergeStates } from '@shared/utils/remote-data';
import { expiryLabel, formatDay, isExpired } from '@shared/domain/utils/expiry';
import { serviceCover } from '@shared/domain/utils/farm-emoji';
import { formatBRL, formatDate, formatHours } from '@shared/utils/format';
import { Button } from '@shared/ui/button';
import { CategoryChip } from '@shared/domain/ui/category-chip';
import { ConfirmDialog } from '@shared/ui/confirm-dialog';
import { ErrorState } from '@shared/ui/error-state';
import { FarmMap } from '@shared/domain/ui/farm-map';
import { pointOf } from '@shared/utils/geocoding';
import { Icon } from '@shared/ui/icon';
import { PhotoStrip } from '@shared/ui/photo-strip';
import { Skeleton } from '@shared/ui/skeleton';
import { StatusBadge } from '@shared/domain/ui/status-badge';
import { VerifiedBadge } from '@shared/domain/ui/verified-badge';
import { RatingBadge } from '@shared/domain/ui/rating-badge';
import { ReportDialog, ReportTarget } from '@shared/domain/ui/report-dialog';
import { ReputationDialog, ReputationTarget } from '@shared/domain/ui/reputation-dialog';
import { ServiceReviews } from '@shared/domain/ui/service-reviews';

@Component({
  selector: 'app-job-detail-page',
  imports: [RouterLink, Button, CategoryChip, ConfirmDialog, ErrorState, FarmMap, Icon, PhotoStrip, RatingBadge, ReportDialog, ReputationDialog, ServiceReviews, Skeleton, StatusBadge, VerifiedBadge],
  templateUrl: './job-detail-page.html',
  styleUrl: './job-detail-page.css'
})
export class JobDetailPage implements OnInit {
  readonly id = input.required<string>(); // parâmetro :id da rota

  private readonly workerService = inject(WorkerService);
  private readonly currentUser = inject(CurrentUserService);
  readonly workerId = this.currentUser.requireId('worker');
  protected readonly switcher = inject(RoleSwitchService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly inbox = inject(ChatInboxService);
  private readonly live = inject(LiveUpdatesService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly serviceId = computed(() => Number(this.id()));

  readonly job = new RemoteData(() => this.workerService.getOpenService(this.serviceId(), this.workerId));
  readonly applications = new RemoteData(() => this.workerService.getWorkerApplications(this.workerId));
  readonly state = computed(() => mergeStates(this.job.state(), this.applications.state()));

  // Conta com os dois perfis: o serviço foi publicado pelo próprio perfil de produtor.
  readonly ownService = computed(() => {
    const farmerId = this.currentUser.user()?.profiles.farmer ?? null;
    return farmerId !== null && this.job.data()?.farmer_id === farmerId;
  });

  readonly myApplication = computed(
    () => this.applications.data()?.find((a) => a.service_id === this.serviceId()) ?? null
  );
  readonly farmPoint = computed(() => {
    const job = this.job.data();
    return job ? pointOf(job.farm) : null;
  });
  readonly price = computed(() => formatBRL(this.job.data()?.price ?? 0));
  protected readonly cover = serviceCover;
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
  // "28/10": cabe na coluna de fatos do topo.
  readonly deadlineDay = computed(() => {
    const job = this.job.data();
    return job?.expires_at && job.status === 'Pending' ? formatDay(job.expires_at).slice(0, 5) : null;
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

  // Conversa com o produtor (abre quando ele aceita a candidatura).
  readonly chat = computed(() => this.inbox.forService(this.serviceId()));
  readonly applicationTitle = computed(() => {
    const job = this.job.data();
    if (this.withdrawKind() === 'service') return 'O serviço é seu';
    if (job?.status === 'Completed' && job.worker_id === this.workerId) return 'Serviço concluído';
    return 'Você já se candidatou';
  });

  // Avaliações da fazenda abertas no diálogo.
  readonly farmReviews = signal<ReputationTarget | null>(null);
  // Vaga sendo denunciada.
  readonly reporting = signal<ReportTarget | null>(null);
  // Muda a cada aviso em tempo real: o painel de avaliações recarrega junto.
  readonly tick = signal(0);

  ngOnInit(): void {
    this.load();
    // Aceite, pagamento ou avaliação do produtor: atualiza sem recarregar a página.
    this.live
      .workerApplications(this.workerId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.refresh());
  }

  showFarmReviews(): void {
    const job = this.job.data();
    if (job) this.farmReviews.set({ kind: 'farm', id: job.farm_id, name: `Fazenda em ${job.farm.city}, ${job.farm.state}` });
  }

  load(): void {
    this.job.load();
    this.applications.load();
  }

  // Depois de uma ação: atualiza sem desmontar a tela (e o mapa da fazenda).
  private refresh(): void {
    this.job.refresh();
    this.applications.refresh();
    this.tick.update((n) => n + 1);
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
