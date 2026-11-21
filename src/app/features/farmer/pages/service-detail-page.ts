import { priceLabel, servicePrice, suggestedTotal } from '@shared/domain/utils/agreement';
import { Component, DestroyRef, OnInit, computed, inject, input, signal } from '@angular/core';
import { ChatInboxService } from '@core/api/chat-inbox.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { positiveNumberValidator } from '@shared/utils/validators';
import { FormField } from '@shared/ui/form-field';
import { MaskedInput } from '@shared/ui/masked-input';
import { Chat } from '@core/models/chat.model';
import { Observable } from 'rxjs';
import { FarmerService } from '../data-access/farmer.service';
import { LiveUpdatesService } from '@core/api/live-updates.service';
import { CurrentUserService } from '@core/session/current-user.service';
import { ToastService } from '@core/toast/toast.service';
import { ApplicationWithWorker } from '@core/models/service-application.model';
import { RemoteData, mergeStates } from '@shared/utils/remote-data';
import { formatDate, formatHours } from '@shared/utils/format';
import { Button, ButtonVariant } from '@shared/ui/button';
import { CategoryChip } from '@shared/domain/ui/category-chip';
import { ConfirmDialog } from '@shared/ui/confirm-dialog';
import { PhotoStrip } from '@shared/ui/photo-strip';
import { expiryLabel, formatDay, isExpired } from '@shared/domain/utils/expiry';
import { EmptyState } from '@shared/ui/empty-state';
import { FarmMap } from '@shared/domain/ui/farm-map';
import { pointOf } from '@shared/utils/geocoding';
import { ErrorState } from '@shared/ui/error-state';
import { Icon } from '@shared/ui/icon';
import { Skeleton } from '@shared/ui/skeleton';
import { StatusBadge } from '@shared/domain/ui/status-badge';
import { WorkerCard } from '../ui/worker-card';
import { ReportDialog, ReportTarget } from '@shared/domain/ui/report-dialog';
import { ReputationDialog, ReputationTarget } from '@shared/domain/ui/reputation-dialog';
import { ServiceReviews } from '@shared/domain/ui/service-reviews';
import { SegmentedControl } from '@shared/ui/segmented-control';
import { byReputation } from '@shared/domain/utils/review-criteria';

type PendingAction =
  | { kind: 'accept'; application: ApplicationWithWorker }
  | { kind: 'reject'; application: ApplicationWithWorker }
  | { kind: 'pay' }
  | { kind: 'cancel' };

interface DialogCopy {
  title: string;
  message: string;
  confirmLabel: string;
  variant: ButtonVariant;
}

@Component({
  selector: 'app-service-detail-page',
  imports: [ReactiveFormsModule, FormField, MaskedInput, RouterLink, Button, CategoryChip, ConfirmDialog, EmptyState, ErrorState, FarmMap, Icon, PhotoStrip, ReportDialog, ReputationDialog, SegmentedControl, ServiceReviews, Skeleton, StatusBadge, WorkerCard],
  templateUrl: './service-detail-page.html',
  styleUrl: './service-detail-page.css'
})
export class ServiceDetailPage implements OnInit {
  readonly id = input.required<string>(); // parâmetro :id da rota

  private readonly farmerService = inject(FarmerService);
  private readonly farmerId = inject(CurrentUserService).requireId('farmer');
  private readonly toast = inject(ToastService);
  private readonly live = inject(LiveUpdatesService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly inbox = inject(ChatInboxService);
  private readonly router = inject(Router);

  private readonly serviceId = computed(() => Number(this.id()));

  readonly service = new RemoteData(() => this.farmerService.getService(this.serviceId()));
  readonly applications = new RemoteData(() => this.farmerService.getServiceApplications(this.serviceId()));
  readonly state = computed(() => mergeStates(this.service.state(), this.applications.state()));

  readonly isOwner = computed(() => this.service.data()?.farmer_id === this.farmerId);
  readonly farmPoint = computed(() => {
    const s = this.service.data();
    return s ? pointOf(s.farm) : null;
  });
  readonly photoUrls = computed(() => this.service.data()?.farm.photos.map((p) => p.url) ?? []);
  readonly expired = computed(() => {
    const s = this.service.data();
    return s ? isExpired(s) : false;
  });
  readonly deadline = computed(() => {
    const s = this.service.data();
    if (!s || s.expires_at === null) return 'Sem prazo';
    return s.status === 'Pending' ? (expiryLabel(s) ?? formatDay(s.expires_at)) : formatDay(s.expires_at);
  });
  readonly acceptedWorker = computed(
    () => this.applications.data()?.find((a) => a.status === 'Accepted')?.worker ?? null
  );

  // Conversa com quem foi aceito e o contador de não lidas dela.
  readonly chat = computed(() => {
    const workerId = this.service.data()?.worker_id ?? null;
    return workerId === null ? null : this.inbox.forService(this.serviceId(), workerId);
  });
  // Conversa da negociação com cada candidato (o produtor abre pelo botão "Conversar").
  chatWith(application: ApplicationWithWorker): Chat | null {
    return this.inbox.forService(this.serviceId(), application.worker_id);
  }
  readonly openingChat = signal<number | null>(null);
  readonly priceOf = priceLabel;
  // Total do pagamento: sugerido pela proposta aceita (empreitada, ou valor por hora × horas), sempre editável.
  readonly payValue = new FormControl<number | null>(null, [Validators.required, positiveNumberValidator]);
  readonly payMessages = { required: 'Informe o total a pagar.', positive: 'Informe um valor maior que zero.' };
  readonly date = formatDate;
  readonly payHint = computed(() => {
    const agreement = this.service.data()?.agreement;
    if (!agreement) return 'Informe o total a pagar.';
    const suggested = suggestedTotal(agreement, this.service.data()?.duration ?? 0);
    return suggested === null
      ? `Combinado: ${priceLabel(agreement)}. Informe o total pelo que foi feito.`
      : `Combinado: ${priceLabel(agreement)}. Sugerimos o total; ajuste se precisar.`;
  });

  askPayment(): void {
    const service = this.service.data();
    this.payValue.reset(service ? suggestedTotal(service.agreement, service.duration) : null);
    this.ask({ kind: 'pay' });
  }

  openChat(application: ApplicationWithWorker): void {
    this.openingChat.set(application.id);
    this.farmerService.openChat(this.serviceId(), application.id).subscribe({
      next: ({ chat }) => {
        this.openingChat.set(null);
        this.inbox.refresh();
        void this.router.navigate(['/produtor/conversas', chat.id]);
      },
      error: () => this.openingChat.set(null)
    });
  }
  readonly chatLabel = computed(() => {
    const chat = this.chat();
    const name = chat?.worker.name.split(' ')[0] ?? '';
    return chat?.open ? `Conversar com ${name}` : `Ver conversa com ${name}`;
  });

  // Ordem dos candidatos: por chegada ou mais bem avaliados primeiro.
  readonly order = signal<'recent' | 'rating'>('recent');
  readonly orderOptions = [{ value: 'recent', label: 'Chegada' }, { value: 'rating', label: 'Mais bem avaliados' }];
  readonly sortedApplications = computed(() => {
    const list = [...(this.applications.data() ?? [])];
    return this.order() === 'rating' ? list.sort(byReputation) : list;
  });

  // Avaliações do candidato abertas no diálogo.
  readonly reviewing = signal<ReputationTarget | null>(null);
  // Candidato sendo denunciado.
  readonly reporting = signal<ReportTarget | null>(null);
  // Muda a cada aviso em tempo real: o painel de avaliações recarrega junto.
  readonly tick = signal(0);
  // O combinado da proposta aceita (depois do aceite) ou a estimativa da vaga.
  readonly price = computed(() => {
    const service = this.service.data();
    return service ? servicePrice(service) : '';
  });
  readonly hours = computed(() => formatHours(this.service.data()?.duration ?? 0));
  readonly publishedAt = computed(() => {
    const service = this.service.data();
    return service ? formatDate(service.insertion_date) : '';
  });

  readonly pending = signal<PendingAction | null>(null);
  readonly acting = signal(false);

  readonly dialog = computed<DialogCopy>(() => {
    const action = this.pending();
    switch (action?.kind) {
      case 'accept':
        return {
          title: `Aceitar ${action.application.worker.name}?`,
          message: 'O serviço passa para "Em andamento" e as outras candidaturas são recusadas.',
          confirmLabel: 'Aceitar trabalhador',
          variant: 'primary'
        };
      case 'reject':
        return {
          title: `Recusar ${action.application.worker.name}?`,
          message: 'A candidatura será recusada. Essa ação não pode ser desfeita.',
          confirmLabel: 'Recusar candidatura',
          variant: 'danger'
        };
      case 'pay':
        return {
          title: 'Liberar pagamento?',
          message: `Simulação: registra o pagamento do total para ${this.acceptedWorker()?.name ?? 'o trabalhador'} e conclui o serviço. Nenhum dinheiro é movimentado.`,
          confirmLabel: 'Liberar pagamento',
          variant: 'primary'
        };
      case 'cancel':
        return {
          title: 'Cancelar serviço?',
          message: 'O serviço sai da lista de vagas e as candidaturas pendentes são recusadas. Essa ação não pode ser desfeita.',
          confirmLabel: 'Cancelar serviço',
          variant: 'danger'
        };
      default:
        return { title: '', message: '', confirmLabel: '', variant: 'primary' };
    }
  });

  ngOnInit(): void {
    this.load();
    // Candidatura ou desistência de um trabalhador: atualiza a lista sem recarregar a página.
    this.live
      .serviceApplications(this.serviceId())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.refresh());
  }

  load(): void {
    this.service.load();
    this.applications.load();
  }

  // Depois de uma ação: atualiza sem desmontar a tela (e o mapa da fazenda).
  private refresh(): void {
    this.service.refresh();
    this.applications.refresh();
    this.tick.update((n) => n + 1);
  }

  setOrder(value: string): void {
    this.order.set(value === 'rating' ? 'rating' : 'recent');
  }

  showReviews(application: ApplicationWithWorker): void {
    this.reviewing.set({ kind: 'worker', id: application.worker_id, name: application.worker.name });
  }

  reportWorker(application: ApplicationWithWorker): void {
    this.reporting.set({ type: 'worker', id: application.worker_id, name: application.worker.name });
  }

  ask(action: PendingAction): void {
    this.pending.set(action);
  }

  cancel(): void {
    this.pending.set(null);
  }

  confirm(): void {
    const action = this.pending();
    if (!action) return;
    if (action.kind === 'pay') {
      this.payValue.markAsTouched();
      if (this.payValue.invalid) return;
    }

    const { request, success } = this.buildAction(action);
    this.acting.set(true);
    request.subscribe({
      next: () => {
        this.toast.success(success);
        this.finish();
        this.refresh();
      },
      error: () => this.finish() // a mensagem já saiu no toast
    });
  }

  private buildAction(action: PendingAction): { request: Observable<unknown>; success: string } {
    const id = this.serviceId();
    switch (action.kind) {
      case 'accept':
        return {
          request: this.farmerService.analyzeOffer(id, action.application.id, 'Accept'),
          success: `${action.application.worker.name} foi aceito(a). O serviço está em andamento.`
        };
      case 'reject':
        return {
          request: this.farmerService.analyzeOffer(id, action.application.id, 'Reject'),
          success: 'Candidatura recusada.'
        };
      case 'pay':
        return {
          request: this.farmerService.processPayment(id, this.payValue.value as number),
          success: 'Pagamento liberado (simulação). Serviço concluído.'
        };
      case 'cancel':
        return {
          request: this.farmerService.cancelService(id),
          success: 'Serviço cancelado.'
        };
    }
  }

  private finish(): void {
    this.acting.set(false);
    this.pending.set(null);
  }
}
