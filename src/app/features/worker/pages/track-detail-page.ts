import { Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { of } from 'rxjs';
import { CurrentUserService } from '@core/session/current-user.service';
import { EnrolledTrack } from '@core/models/track.model';
import { RemoteData } from '@shared/utils/remote-data';
import { formatDate, formatDuration } from '@shared/utils/format';
import { Button } from '@shared/ui/button';
import { CategoryChip } from '@shared/domain/ui/category-chip';
import { ErrorState } from '@shared/ui/error-state';
import { Icon } from '@shared/ui/icon';
import { ProgressBar } from '@shared/ui/progress-bar';
import { Skeleton } from '@shared/ui/skeleton';
import { LearningService } from '../data-access/learning.service';
import { TrackCover } from '../ui/track-cover';
import { TrackOutline } from '../ui/track-outline';

// A página da trilha: a capa, o que se aprende, a carga horária e quem ensina; o botão para começar ou
// continuar já no topo (com o nome da próxima aula) e o caminho das aulas, com as já feitas marcadas.
@Component({
  selector: 'app-track-detail-page',
  imports: [RouterLink, Button, CategoryChip, ErrorState, Icon, ProgressBar, Skeleton, TrackCover, TrackOutline],
  template: `
    <div class="container page">
      <a class="back-link" routerLink="/trabalhador/trilhas"><app-icon name="arrow-left" [size]="20" />Trilhas</a>

      @switch (track.state().status) {
        @case ('loading') { <app-skeleton [count]="1" [height]="320" /> }
        @case ('error') { <app-error-state [message]="track.error()" (retry)="track.load()" /> }
        @case ('success') {
          @if (track.data(); as t) {
            <div class="layout">
              <app-track-cover [categories]="t.categories" [tall]="true" />
              <header class="stack-sm">
                <div class="cluster">@for (c of t.categories; track c) { <span appCategoryChip>{{ c }}</span> }</div>
                <h1>{{ t.title }}</h1>
                <p class="facts t-body-sm">
                  <span><app-icon name="clock" [size]="18" />{{ duration(t.workload_minutes) }}</span>
                  <span><app-icon name="book" [size]="18" />{{ t.module_count }} {{ t.module_count === 1 ? 'módulo' : 'módulos' }}, {{ t.lesson_count }} {{ t.lesson_count === 1 ? 'aula' : 'aulas' }}</span>
                  <span><app-icon name="user" [size]="18" />{{ tutors() }}</span>
                </p>
              </header>
              <aside class="cta card stack" aria-label="Sua participação">
                @if (t.progress; as p) {
                  @if (p.completed_at) {
                    <p class="done t-label"><app-icon name="award" [size]="22" />Você concluiu esta trilha em {{ date(p.completed_at) }}.</p>
                    <a appButton routerLink="/trabalhador/certificados">Ver certificado</a>
                    <a appButton variant="secondary" [routerLink]="['/trabalhador/trilhas', t.id, 'aulas']">Rever as aulas</a>
                  } @else {
                    <div class="stack-sm">
                      <p class="t-body-sm"><b>{{ p.percent }}%</b> concluído, {{ p.completed_lessons }} de {{ p.total_lessons }} aulas</p>
                      <app-progress-bar [value]="p.percent" [label]="'Progresso em ' + t.title" />
                    </div>
                    @if (next(); as lesson) { <p class="next t-body-sm"><span class="muted">Próxima aula</span><b>{{ lesson.title }}</b></p> }
                    <a appButton [routerLink]="['/trabalhador/trilhas', t.id, 'aulas']">Continuar<app-icon name="arrow-right" [size]="20" /></a>
                  }
                  @if (t.status === 'discontinued') {
                    <p class="t-body-sm muted">Esta trilha foi descontinuada, mas você pode terminá-la e receber o certificado.</p>
                  }
                } @else {
                  <p class="t-body-sm">Estude no seu tempo: o progresso fica salvo a cada aula.</p>
                  <button appButton type="button" [loading]="starting()" (click)="start(t.id)">Começar trilha<app-icon name="arrow-right" [size]="20" /></button>
                }
                <p class="certificate t-body-sm muted"><app-icon name="award" [size]="18" />Ao terminar, certificado de {{ duration(t.workload_minutes) }} em seu nome, que qualquer pessoa confere pelo código.</p>
              </aside>
              <p class="description">{{ t.description }}</p>
              <section class="card stack" aria-labelledby="conteudo">
                <h2 id="conteudo" class="t-h3">O caminho da trilha</h2>
                <app-track-outline [modules]="t.modules" [completed]="completedIds()" [currentId]="next()?.id ?? null" [trackId]="t.progress ? t.id : null" />
              </section>
            </div>
          }
        }
      }
    </div>
  `,
  styles: `
    .layout { display: grid; gap: var(--space-6); align-items: start; }
    h1 { margin: 0; }
    .facts { display: flex; flex-wrap: wrap; gap: var(--space-1) var(--space-4); margin: 0; color: var(--ink-muted); }
    .facts span { display: inline-flex; align-items: center; gap: var(--space-1); }
    .description { margin: 0; white-space: pre-line; max-width: 68ch; }
    .cta p { margin: 0; }
    .next { display: grid; gap: 2px; padding: var(--space-3) var(--space-4); border-radius: var(--radius-md); background: var(--broto-soft); }
    .done, .certificate { display: flex; align-items: flex-start; gap: var(--space-2); }
    .done { color: var(--success); }
    .certificate { padding-top: var(--space-3); border-top: 1px solid var(--line); }
    /* No computador, o botão fica ao lado (fixo ao rolar); no celular, logo depois do título. */
    @media (min-width: 1024px) {
      .layout { grid-template-columns: minmax(0, 1fr) 320px; column-gap: var(--space-8); }
      .layout > * { grid-column: 1; }
      .layout > .cta { grid-column: 2; grid-row: 1 / span 4; position: sticky; top: calc(var(--shell-top, 0px) + var(--space-6)); }
    }
  `
})
export class TrackDetailPage {
  readonly id = input.required<string>();

  private readonly learning = inject(LearningService);
  private readonly router = inject(Router);
  private readonly workerId = inject(CurrentUserService).requireId('worker');

  readonly track = new RemoteData(() => this.learning.getTrack(Number(this.id()), this.workerId));
  // Quem já começou: as aulas feitas (para marcar o caminho) e a próxima.
  readonly enrolled = new RemoteData<EnrolledTrack | null>(() =>
    this.track.data()?.progress ? this.learning.getEnrolledTrack(this.workerId, Number(this.id())) : of(null)
  );
  readonly tutors = computed(() => (this.track.data()?.tutors ?? []).map((t) => t.name).join(', '));
  readonly completedIds = computed(() => this.enrolled.data()?.completed_lesson_ids ?? []);
  readonly next = computed(() => {
    const enrolled = this.enrolled.data();
    if (!enrolled) return null;
    const done = new Set(enrolled.completed_lesson_ids);
    return enrolled.modules.flatMap((m) => m.lessons).find((l) => !done.has(l.id)) ?? null;
  });
  readonly starting = signal(false);

  readonly duration = formatDuration;
  readonly date = formatDate;

  constructor() {
    effect(() => {
      this.id();
      untracked(() => this.track.load());
    });
    effect(() => {
      if (this.track.data()) untracked(() => this.enrolled.load());
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
