import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { WorkerTrackSummary } from '@core/models/track.model';
import { formatDuration } from '@shared/utils/format';
import { CategoryChip } from '@shared/domain/ui/category-chip';
import { Button } from '@shared/ui/button';
import { Icon } from '@shared/ui/icon';
import { ProgressBar } from '@shared/ui/progress-bar';
import { TrackCover } from './track-cover';

// Card de uma trilha. `grid`: o card inteiro abre a trilha. `resume` (Continue estudando): mais largo,
// com o progresso em destaque e o botão que volta direto para a aula de onde parou.
@Component({
  selector: 'app-track-card',
  imports: [RouterLink, Button, CategoryChip, Icon, ProgressBar, TrackCover],
  template: `
    @if (variant() === 'resume' && track().progress; as p) {
      <article class="resume">
        <app-track-cover [categories]="track().categories" />
        <div class="body">
          <a class="t-h3 title" [routerLink]="link()">{{ track().title }}</a>
          <p class="t-body-sm muted">{{ p.completed_lessons }} de {{ p.total_lessons }} aulas, {{ workload() }} no total</p>
          <app-progress-bar [value]="p.percent" [label]="'Progresso em ' + track().title" />
          <div class="actions">
            <a appButton [routerLink]="['/trabalhador/trilhas', track().id, 'aulas']">Continuar<app-icon name="arrow-right" [size]="20" /></a>
            <span class="t-body-sm"><b>{{ p.percent }}%</b> concluído</span>
          </div>
        </div>
      </article>
    } @else {
      <a class="card-link" [routerLink]="link()">
        <app-track-cover [categories]="track().categories" />
        <span class="body">
          <span class="cluster chips">
            @for (c of track().categories; track c) { <span appCategoryChip>{{ c }}</span> }
          </span>
          <span class="t-h3 title">{{ track().title }}</span>
          <span class="muted description">{{ track().description }}</span>
          <span class="meta t-body-sm muted">
            <span><app-icon name="clock" [size]="16" />{{ workload() }}</span>
            <span><app-icon name="book" [size]="16" />{{ track().lesson_count }} {{ track().lesson_count === 1 ? 'aula' : 'aulas' }}</span>
            @if (tutors()) { <span><app-icon name="user" [size]="16" />{{ tutors() }}</span> }
          </span>
          @if (track().progress?.completed_at) {
            <span class="done t-label"><app-icon name="award" [size]="18" />Concluída, com certificado</span>
          }
        </span>
      </a>
    }
  `,
  styles: `
    :host { display: block; height: 100%; }
    .card-link, .resume {
      display: grid; grid-template-rows: auto 1fr; height: 100%; overflow: hidden;
      border: 1px solid var(--line); border-radius: var(--radius-lg); background: var(--surface-raised); box-shadow: var(--shadow-card);
      color: var(--ink); text-decoration: none;
    }
    .card-link:hover { border-color: var(--line-strong); }
    .body { display: grid; gap: var(--space-2); align-content: start; padding: var(--space-4) var(--space-6) var(--space-6); }
    .chips { gap: var(--space-1); }
    .title { overflow-wrap: anywhere; color: var(--ink); text-decoration: none; }
    .description { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .meta { display: flex; flex-wrap: wrap; gap: var(--space-1) var(--space-4); }
    .meta span, .done { display: inline-flex; align-items: center; gap: var(--space-1); }
    .done { color: var(--success); }
    .resume .body p { margin: 0; }
    .resume a.title:hover { text-decoration: underline; text-underline-offset: 3px; }
    .actions { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-3) var(--space-4); padding-top: var(--space-2); }
    @media (min-width: 720px) {
      .resume { grid-template-rows: none; grid-template-columns: minmax(200px, 38%) 1fr; }
      .resume app-track-cover { aspect-ratio: auto; height: 100%; }
      .resume .body { align-content: center; padding: var(--space-6); }
    }
  `
})
export class TrackCard {
  readonly track = input.required<WorkerTrackSummary>();
  readonly variant = input<'grid' | 'resume'>('grid');

  readonly link = computed(() => ['/trabalhador/trilhas', this.track().id]);
  readonly workload = computed(() => formatDuration(this.track().workload_minutes));
  readonly tutors = computed(() => this.track().tutors.map((t) => t.name).join(', '));
}
