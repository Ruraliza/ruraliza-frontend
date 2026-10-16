import { Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CurrentUserService } from '@core/session/current-user.service';
import { RemoteData } from '@shared/utils/remote-data';
import { formatDate, formatDuration } from '@shared/utils/format';
import { Button } from '@shared/ui/button';
import { CategoryChip } from '@shared/domain/ui/category-chip';
import { ErrorState } from '@shared/ui/error-state';
import { Icon } from '@shared/ui/icon';
import { ProgressBar } from '@shared/ui/progress-bar';
import { Skeleton } from '@shared/ui/skeleton';
import { LearningService } from '../data-access/learning.service';
import { TrackOutline } from '../ui/track-outline';

// A trilha antes de começar: descrição, carga horária, tutores e o que tem em cada módulo.
@Component({
  selector: 'app-track-detail-page',
  imports: [RouterLink, Button, CategoryChip, ErrorState, Icon, ProgressBar, Skeleton, TrackOutline],
  template: `
    <div class="container page">
      <a class="back-link" routerLink="/trabalhador/trilhas"><app-icon name="arrow-left" [size]="20" />Trilhas</a>

      @switch (track.state().status) {
        @case ('loading') { <app-skeleton [count]="1" [height]="320" /> }
        @case ('error') { <app-error-state [message]="track.error()" (retry)="track.load()" /> }
        @case ('success') {
          @if (track.data(); as t) {
            <header class="stack-sm">
              <div class="cluster">@for (c of t.categories; track c) { <span appCategoryChip>{{ c }}</span> }</div>
              <h1>{{ t.title }}</h1>
            </header>

            <div class="layout">
              <div class="stack">
                <section class="card stack">
                  <p class="description">{{ t.description }}</p>
                  <dl class="details">
                    <div><dt>Carga horária</dt><dd>{{ duration(t.workload_minutes) }}</dd></div>
                    <div><dt>Conteúdo</dt><dd>{{ t.module_count }} {{ t.module_count === 1 ? 'módulo' : 'módulos' }}, {{ t.lesson_count }} {{ t.lesson_count === 1 ? 'aula' : 'aulas' }}</dd></div>
                    <div><dt>{{ t.tutors.length === 1 ? 'Tutor' : 'Tutores' }}</dt><dd>{{ tutors() }}</dd></div>
                    @if (t.published_at) { <div><dt>Publicada em</dt><dd>{{ date(t.published_at) }}</dd></div> }
                  </dl>
                </section>

                <section class="card stack" aria-labelledby="conteudo">
                  <h2 id="conteudo" class="t-h3">Conteúdo da trilha</h2>
                  <app-track-outline [modules]="t.modules" />
                </section>
              </div>

              <aside class="card stack cta" aria-label="Sua participação">
                @if (t.progress; as p) {
                  @if (p.completed_at) {
                    <p class="done t-label"><app-icon name="award" [size]="20" />Você concluiu esta trilha em {{ date(p.completed_at) }}.</p>
                    <a appButton routerLink="/trabalhador/certificados">Ver certificado</a>
                    <a appButton variant="secondary" [routerLink]="['/trabalhador/trilhas', t.id, 'aulas']">Rever as aulas</a>
                  } @else {
                    <p class="t-body-sm"><b>{{ p.percent }}%</b> concluído ({{ p.completed_lessons }} de {{ p.total_lessons }} aulas)</p>
                    <app-progress-bar [value]="p.percent" [label]="'Progresso em ' + t.title" />
                    <a appButton [routerLink]="['/trabalhador/trilhas', t.id, 'aulas']">Continuar<app-icon name="arrow-right" [size]="20" /></a>
                  }
                  @if (t.status === 'discontinued') {
                    <p class="t-body-sm muted">Esta trilha foi descontinuada, mas você pode terminá-la e receber o certificado.</p>
                  }
                } @else {
                  <p class="t-body-sm muted">Ao concluir todas as aulas, você recebe um certificado da Ruraliza com a carga horária.</p>
                  <button appButton type="button" [loading]="starting()" (click)="start(t.id)">Começar trilha<app-icon name="arrow-right" [size]="20" /></button>
                }
              </aside>
            </div>
          }
        }
      }
    </div>
  `,
  styles: `
    .description { white-space: pre-line; }
    .layout { display: grid; gap: var(--space-6); align-items: start; }
    @media (min-width: 1024px) {
      .layout { grid-template-columns: minmax(0, 1fr) 320px; }
      .cta { position: sticky; top: calc(var(--shell-top, 0px) + var(--space-6)); }
    }
    .done { display: flex; align-items: center; gap: var(--space-2); color: var(--success); }
  `
})
export class TrackDetailPage {
  readonly id = input.required<string>();

  private readonly learning = inject(LearningService);
  private readonly router = inject(Router);
  private readonly workerId = inject(CurrentUserService).requireId('worker');

  readonly track = new RemoteData(() => this.learning.getTrack(Number(this.id()), this.workerId));
  readonly tutors = computed(() => (this.track.data()?.tutors ?? []).map((t) => t.name).join(', '));
  readonly starting = signal(false);

  readonly duration = formatDuration;
  readonly date = formatDate;

  constructor() {
    effect(() => {
      this.id();
      untracked(() => this.track.load());
    });
  }

  start(trackId: number): void {
    this.starting.set(true);
    this.learning.enroll(trackId, this.workerId).subscribe({
      next: () => void this.router.navigate(['/trabalhador/trilhas', trackId, 'aulas']),
      error: () => {
        this.starting.set(false);
        this.track.refresh(); // ex.: foi descontinuada enquanto a página estava aberta
      }
    });
  }
}
