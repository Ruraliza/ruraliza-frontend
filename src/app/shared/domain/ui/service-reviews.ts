import { Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { Observable } from 'rxjs';
import { ReviewService } from '@core/api/review.service';
import { ToastService } from '@core/toast/toast.service';
import { FarmerServiceReviews, WorkerServiceReviews } from '@core/models/review.model';
import { RemoteData } from '../../utils/remote-data';
import { formatDate } from '../../utils/format';
import { Icon } from '../../ui/icon';
import { ReviewDraft, ReviewForm } from './review-form';
import { ReviewScores } from './review-scores';

type Reviews = FarmerServiceReviews | WorkerServiceReviews;

// Avaliação dupla de um serviço concluído, do ponto de vista de quem abre a tela:
// avaliar (se ainda pode), ver a própria avaliação e a recebida. A recebida só aparece
// quando os dois avaliaram (ou o prazo acaba): isso evita nota "de troco".
// O produtor avalia o trabalhador (`role="farmer"`); o trabalhador avalia a fazenda (`role="worker"`).
@Component({
  selector: 'app-service-reviews',
  imports: [Icon, ReviewForm, ReviewScores],
  template: `
    @if (reviews.data(); as r) {
      @if (r.window_ends_at !== null) {
        <section class="card reviews" aria-labelledby="reviews-title">
          <header>
            <h2 id="reviews-title" class="t-h3">Avaliação</h2>
            @if (r.can_review) {
              <p class="muted">Como foi {{ role() === 'farmer' ? 'o trabalho de ' + subject() : 'na fazenda' }}? Você tem até {{ date(r.window_ends_at) }} para avaliar.</p>
            }
          </header>

          @if (r.can_review) {
            @if (r.received_hidden) {
              <p class="nudge" role="status"><app-icon name="lock" [size]="20" />{{ hiddenNudge() }}</p>
            }
            <app-review-form [target]="role() === 'farmer' ? 'worker' : 'farm'" [loading]="sending()" (submitted)="send($event)" />
            <p class="t-body-sm muted">As notas ficam escondidas até vocês dois avaliarem. Depois de enviar, não dá para mudar.</p>
          } @else {
            <div class="pair">
              <div class="side">
                <h3 class="t-label">Sua avaliação</h3>
                @if (r.given; as given) {
                  <app-review-scores [review]="given" />
                } @else {
                  <p class="muted">Você não avaliou. O prazo terminou em {{ date(r.window_ends_at) }}.</p>
                }
              </div>
              <div class="side">
                <h3 class="t-label">{{ role() === 'farmer' ? 'O que ' + subject() + ' achou da fazenda' : 'O que o produtor achou do seu trabalho' }}</h3>
                @if (r.received; as received) {
                  <app-review-scores [review]="received" />
                } @else if (r.received_hidden) {
                  <p class="muted">Já chegou. Aparece quando você avaliar.</p>
                } @else {
                  <p class="muted"><app-icon name="clock" [size]="18" />Aguardando {{ role() === 'farmer' ? subject() : 'o produtor' }} avaliar (até {{ date(r.window_ends_at) }}).</p>
                }
              </div>
            </div>
          }
        </section>
      }
    }
  `,
  styles: `
    .reviews { display: grid; gap: var(--space-4); }
    header { display: grid; gap: var(--space-1); }
    header p { margin: 0; }
    .nudge {
      display: flex; align-items: center; gap: var(--space-2); margin: 0;
      padding: var(--space-3) var(--space-4); border-radius: var(--radius-md); background: var(--ipe-soft); font-weight: 600;
    }
    .pair { display: grid; gap: var(--space-6); grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); }
    .side { display: grid; gap: var(--space-3); align-content: start; }
    .side h3 { margin: 0; }
    .side p { display: flex; align-items: center; gap: var(--space-2); margin: 0; }
  `
})
export class ServiceReviews {
  readonly role = input.required<'farmer' | 'worker'>();
  readonly serviceId = input.required<number>();
  readonly workerId = input<number | null>(null); // obrigatório no painel do trabalhador
  readonly subject = input(''); // no painel do produtor: o nome de quem fez o serviço
  // Muda quando a tela recebe um aviso em tempo real: recarrega sem piscar.
  readonly refresh = input(0);

  private readonly reviewService = inject(ReviewService);
  private readonly toast = inject(ToastService);

  readonly reviews = new RemoteData<Reviews>(() => this.fetch());
  readonly sending = signal(false);
  readonly date = (iso: string | null): string => (iso ? formatDate(iso) : '');
  readonly hiddenNudge = computed(() =>
    this.role() === 'farmer'
      ? `${this.subject()} já avaliou a fazenda. Avalie também para ver a nota.`
      : 'O produtor já avaliou seu trabalho. Avalie a fazenda para ver a nota.'
  );

  constructor() {
    effect(() => {
      this.serviceId();
      this.refresh();
      untracked(() => this.reviews.refresh());
    });
  }

  send(draft: ReviewDraft): void {
    this.sending.set(true);
    const request: Observable<{ reviews: Reviews }> = this.role() === 'farmer'
      ? this.reviewService.reviewWorker(this.serviceId(), {
          punctuality: draft.scores['punctuality'] ?? 0, effort: draft.scores['effort'] ?? 0, quality: draft.scores['quality'] ?? 0, comment: draft.comment
        })
      : this.reviewService.reviewFarm(this.serviceId(), {
          worker_id: this.workerId() ?? 0,
          infrastructure: draft.scores['infrastructure'] ?? 0, conditions: draft.scores['conditions'] ?? 0, as_described: draft.scores['as_described'] ?? 0,
          comment: draft.comment
        });
    request.subscribe({
      next: ({ reviews }) => {
        this.sending.set(false);
        this.reviews.replace(reviews);
        this.toast.success(reviews.received ? 'Avaliação enviada. As notas de vocês dois já aparecem.' : 'Avaliação enviada.');
      },
      error: () => this.sending.set(false) // a mensagem já saiu no toast
    });
  }

  private fetch(): Observable<Reviews> {
    if (this.role() === 'farmer') return this.reviewService.farmerServiceReviews(this.serviceId());
    return this.reviewService.workerServiceReviews(this.serviceId(), this.workerId() ?? 0);
  }
}
