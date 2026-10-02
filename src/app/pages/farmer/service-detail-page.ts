import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { FarmerService } from '../../core/api/farmer.service';
import { CurrentUserService } from '../../core/session/current-user.service';
import { ToastService } from '../../core/toast/toast.service';
import { ApplicationWithWorker } from '../../../models/service-application.model';
import { RemoteData, mergeStates } from '../../shared/utils/remote-data';
import { formatBRL, formatDate, formatHours } from '../../shared/utils/format';
import { Button, ButtonVariant } from '../../shared/ui/button';
import { CategoryChip } from '../../shared/ui/category-chip';
import { ConfirmDialog } from '../../shared/ui/confirm-dialog';
import { PhotoStrip } from '../../shared/ui/photo-strip';
import { expiryLabel, formatDay, isExpired } from '../../shared/utils/expiry';
import { EmptyState } from '../../shared/ui/empty-state';
import { FarmMap } from '../../shared/ui/farm-map';
import { pointOf } from '../../shared/utils/geocoding';
import { ErrorState } from '../../shared/ui/error-state';
import { Icon } from '../../shared/ui/icon';
import { Skeleton } from '../../shared/ui/skeleton';
import { StatusBadge } from '../../shared/ui/status-badge';
import { WorkerCard } from '../../shared/ui/worker-card';

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
  imports: [RouterLink, Button, CategoryChip, ConfirmDialog, EmptyState, ErrorState, FarmMap, Icon, PhotoStrip, Skeleton, StatusBadge, WorkerCard],
  templateUrl: './service-detail-page.html',
  styleUrl: './service-detail-page.css'
})
export class ServiceDetailPage implements OnInit {
  readonly id = input.required<string>(); // parâmetro :id da rota

  private readonly farmerService = inject(FarmerService);
  private readonly farmerId = inject(CurrentUserService).requireId('farmer');
  private readonly toast = inject(ToastService);

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
  readonly price = computed(() => formatBRL(this.service.data()?.price ?? 0));
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
          message: `Simulação: registra o pagamento de ${this.price()} para ${this.acceptedWorker()?.name ?? 'o trabalhador'} e conclui o serviço. Nenhum dinheiro é movimentado.`,
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
  }

  load(): void {
    this.service.load();
    this.applications.load();
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

    const { request, success } = this.buildAction(action);
    this.acting.set(true);
    request.subscribe({
      next: () => {
        this.toast.success(success);
        this.finish();
        this.load();
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
          request: this.farmerService.processPayment(id),
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
