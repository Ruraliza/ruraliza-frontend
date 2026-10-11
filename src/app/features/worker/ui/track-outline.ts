import { Component, computed, input } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { RouterLink } from '@angular/router';
import { formatDuration } from '@shared/utils/format';
import { Icon } from '@shared/ui/icon';

export interface OutlineLesson {
  id: number;
  title: string;
  duration_minutes: number;
}

export interface OutlineModule {
  id: number;
  title: string;
  lessons: OutlineLesson[];
}

// Sumário da trilha: módulos e aulas, com o estado de cada aula (concluída / atual / pendente).
// Com `trackId`, cada aula vira link para o player; sem ele, é só a lista (antes de começar).
@Component({
  selector: 'app-track-outline',
  imports: [NgTemplateOutlet, RouterLink, Icon],
  template: `
    <ol class="modules" role="list">
      @for (m of modules(); track m.id; let mi = $index) {
        <li class="module">
          <p class="module-title">
            <span class="t-overline muted">Módulo {{ mi + 1 }}</span>
            <span class="t-label">{{ m.title }}</span>
          </p>
          <ol class="lessons" role="list">
            @for (l of m.lessons; track l.id) {
              <li>
                @if (trackId(); as id) {
                  <a
                    class="lesson"
                    [class.current]="l.id === currentId()"
                    [routerLink]="['/trabalhador/trilhas', id, 'aulas', l.id]"
                    [attr.aria-current]="l.id === currentId() ? 'step' : null"
                  >
                    <ng-container *ngTemplateOutlet="row; context: { $implicit: l }" />
                  </a>
                } @else {
                  <span class="lesson"><ng-container *ngTemplateOutlet="row; context: { $implicit: l }" /></span>
                }
              </li>
            }
          </ol>
        </li>
      }
    </ol>

    <ng-template #row let-l>
      <span class="state" [class.is-done]="done().has(l.id)">
        @if (done().has(l.id)) { <app-icon name="check" [size]="16" label="Concluída" /> }
        @else { <app-icon name="circle" [size]="16" /> }
      </span>
      <span class="name">{{ l.title }}</span>
      <span class="t-body-sm muted time">{{ duration(l.duration_minutes) }}</span>
    </ng-template>
  `,
  styles: `
    .modules { display: grid; gap: var(--space-4); }
    .module { display: grid; gap: var(--space-2); }
    .module-title { display: grid; gap: 2px; padding-inline: var(--space-2); }
    .lessons { display: grid; gap: 2px; }
    .lesson {
      display: grid; grid-template-columns: 24px minmax(0, 1fr) auto; align-items: center; gap: var(--space-2);
      min-height: 44px; padding: var(--space-2); border-radius: var(--radius-md);
      color: var(--ink); text-decoration: none;
    }
    a.lesson:hover { background: var(--surface-sunken); }
    a.lesson.current { background: var(--broto-soft); font-weight: 600; }
    .state { display: grid; place-items: center; width: 24px; height: 24px; border-radius: 50%; color: var(--ink-muted); }
    .state.is-done { background: var(--success); color: #fff; }
    .name { overflow-wrap: anywhere; }
    .time { white-space: nowrap; }
  `
})
export class TrackOutline {
  readonly modules = input.required<OutlineModule[]>();
  readonly completed = input<readonly number[]>([]);
  readonly currentId = input<number | null>(null);
  readonly trackId = input<number | null>(null);

  readonly done = computed(() => new Set(this.completed()));
  readonly duration = formatDuration;
}
