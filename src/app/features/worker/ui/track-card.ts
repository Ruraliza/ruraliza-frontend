import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { WorkerTrackSummary } from '@core/models/track.model';
import { formatDuration } from '@shared/utils/format';
import { CategoryChip } from '@shared/domain/ui/category-chip';
import { Icon } from '@shared/ui/icon';
import { ProgressBar } from '@shared/ui/progress-bar';

// Card de uma trilha na lista: categorias, nome, resumo, carga horária, tutores e o progresso.
@Component({
  selector: 'app-track-card',
  imports: [RouterLink, CategoryChip, Icon, ProgressBar],
  template: `
    <a class="card" [routerLink]="['/trabalhador/trilhas', track().id]">
      <span class="cluster chips">
        @for (c of track().categories; track c) { <span appCategoryChip>{{ c }}</span> }
      </span>
      <span class="t-h3 title">{{ track().title }}</span>
      <span class="muted description">{{ track().description }}</span>
      <span class="meta t-body-sm muted">
        <span><app-icon name="clock" [size]="16" />{{ workload() }}</span>
        <span><app-icon name="book" [size]="16" />{{ track().lesson_count }} {{ track().lesson_count === 1 ? 'aula' : 'aulas' }}</span>
      </span>
      @if (tutors()) { <span class="t-body-sm muted">Com {{ tutors() }}</span> }

      @if (track().progress; as p) {
        <span class="progress">
          @if (p.completed_at) {
            <span class="done t-label"><app-icon name="award" [size]="18" />Concluída</span>
          } @else {
            <span class="t-body-sm"><b>{{ p.percent }}%</b> concluído</span>
            <app-progress-bar [value]="p.percent" [label]="'Progresso em ' + track().title" />
          }
        </span>
      }
    </a>
  `,
  styles: `
    .card {
      display: grid; gap: var(--space-2); align-content: start; height: 100%;
      color: var(--ink); text-decoration: none;
    }
    .card:hover { border-color: var(--line-strong); }
    .chips { gap: var(--space-1); }
    .title { overflow-wrap: anywhere; }
    .description { display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
    .meta { display: flex; flex-wrap: wrap; gap: var(--space-4); }
    .meta span, .done { display: inline-flex; align-items: center; gap: var(--space-1); }
    .progress { display: grid; gap: var(--space-1); margin-top: var(--space-2); }
    .done { color: var(--success); }
  `
})
export class TrackCard {
  readonly track = input.required<WorkerTrackSummary>();

  readonly workload = computed(() => formatDuration(this.track().workload_minutes));
  readonly tutors = computed(() => this.track().tutors.map((t) => t.name).join(', '));
}
