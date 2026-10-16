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

// Sumário da trilha desenhado como uma trilha mesmo: cada aula é uma parada no caminho, ligada à
// próxima. Concluída: parada verde com o caminho já feito em verde; atual: anel; pendente: vazia.
// Com `trackId`, cada aula vira link para o player; sem ele, é só a lista (antes de começar).
@Component({
  selector: 'app-track-outline',
  imports: [NgTemplateOutlet, RouterLink, Icon],
  template: `
    <ol class="modules" role="list">
      @for (m of modules(); track m.id; let mi = $index) {
        <li class="module">
          <p class="module-title">
            <span class="t-label muted">Módulo {{ mi + 1 }}@if (completed().length) {<span>, {{ doneIn(m) }} de {{ m.lessons.length }}</span>}</span>
            <span class="t-label title">{{ m.title }}</span>
          </p>
          <ol class="lessons" role="list">
            @for (l of m.lessons; track l.id) {
              <li [class.is-done]="done().has(l.id)" [class.is-current]="l.id === currentId()">
                @if (trackId(); as id) {
                  <a class="lesson" [routerLink]="['/trabalhador/trilhas', id, 'aulas', l.id]" [attr.aria-current]="l.id === currentId() ? 'step' : null">
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
      <span class="stop">
        @if (done().has(l.id)) { <app-icon name="check" [size]="14" label="Concluída" /> }
      </span>
      <span class="name">{{ l.title }}</span>
      <span class="t-body-sm muted time">{{ duration(l.duration_minutes) }}</span>
    </ng-template>
  `,
  styles: `
    .modules { display: grid; gap: var(--space-4); margin: 0; padding: 0; list-style: none; }
    .module { display: grid; gap: var(--space-1); }
    .module-title { display: grid; gap: 2px; margin: 0; padding-inline: var(--space-2); }
    .lessons { margin: 0; padding: 0; list-style: none; }
    .lessons > li { position: relative; }
    /* O caminho: passa pelo centro das paradas; o trecho já feito fica verde. */
    .lessons > li::before {
      content: ''; position: absolute; left: calc(var(--space-2) + 11px); top: 0; bottom: 0;
      border-left: 2px dashed var(--line-strong);
    }
    .lessons > li:first-child::before { top: 50%; }
    .lessons > li:last-child::before { bottom: 50%; }
    .lessons > li:only-child::before { display: none; }
    .lessons > li.is-done::before { border-left-style: solid; border-color: var(--mata); }
    .lesson {
      position: relative; display: grid; grid-template-columns: 24px minmax(0, 1fr) auto; align-items: center; gap: var(--space-3);
      min-height: 48px; padding: var(--space-2); border-radius: var(--radius-md); color: var(--ink); text-decoration: none;
    }
    a.lesson:hover { background: var(--surface-sunken); }
    .is-current a.lesson { background: var(--broto-soft); font-weight: 600; }
    .stop {
      display: grid; place-items: center; width: 24px; height: 24px; border-radius: 50%;
      border: 2px solid var(--line-strong); background: var(--surface-raised); color: var(--on-mata);
    }
    .is-done .stop { border-color: var(--mata); background: var(--mata); }
    .is-current .stop { border-color: var(--mata); box-shadow: 0 0 0 4px var(--broto); }
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

  doneIn(module: OutlineModule): number {
    return module.lessons.filter((l) => this.done().has(l.id)).length;
  }
}
