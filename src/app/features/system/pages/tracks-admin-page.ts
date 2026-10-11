import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SystemSessionService } from '@core/session/system-session.service';
import { RemoteData } from '@shared/utils/remote-data';
import { formatDate, formatDuration } from '@shared/utils/format';
import { Button } from '@shared/ui/button';
import { EmptyState } from '@shared/ui/empty-state';
import { ErrorState } from '@shared/ui/error-state';
import { Icon } from '@shared/ui/icon';
import { SegmentOption, SegmentedControl } from '@shared/ui/segmented-control';
import { Skeleton } from '@shared/ui/skeleton';
import { TracksService } from '../data-access/tracks.service';
import { TrackStatusBadge } from '../ui/track-status-badge';

type Scope = 'mine' | 'all';

// Trilhas de estudo. O tutor vê as dele (filtro "Minhas") e as dos colegas, só para ver; o administrador
// vê e edita todas.
@Component({
  selector: 'app-tracks-admin-page',
  imports: [RouterLink, Button, EmptyState, ErrorState, Icon, SegmentedControl, Skeleton, TrackStatusBadge],
  template: `
    <div class="container page">
      <div class="page-header">
        <div>
          <h1>Trilhas de estudo</h1>
          <p class="muted">Trilhas não são removidas: quando não fizer mais sentido, descontinue.</p>
        </div>
        <a appButton routerLink="/sistema/trilhas/nova"><app-icon name="plus" [size]="20" />Nova trilha</a>
      </div>

      @if (!oversees) { <app-segmented-control [options]="scopes" [(value)]="scope" label="Quais trilhas" /> }

      @switch (tracks.state().status) {
        @case ('loading') { <app-skeleton [count]="3" [height]="88" /> }
        @case ('error') { <app-error-state [message]="tracks.error()" (retry)="tracks.load()" /> }
        @case ('success') {
          @if (visible().length) {
            <ul class="list" role="list">
              @for (t of visible(); track t.id) {
                <li>
                  <a class="row" [routerLink]="['/sistema/trilhas', t.id]">
                    <span class="what">
                      <span class="t-h3">{{ t.title }}</span>
                      <span class="t-body-sm muted">
                        {{ t.categories.join(', ') }} · {{ t.lesson_count }} {{ t.lesson_count === 1 ? 'aula' : 'aulas' }} · {{ duration(t.workload_minutes) }}
                      </span>
                      <span class="t-body-sm muted">
                        {{ t.tutors.length === 1 ? 'Tutor' : 'Tutores' }}: {{ names(t) }} · editada em {{ date(t.updated_at) }}
                      </span>
                    </span>
                    <span class="side">
                      <app-track-status-badge [status]="t.status" />
                      @if (!t.can_edit) { <span class="t-body-sm muted">Só leitura</span> }
                    </span>
                  </a>
                </li>
              }
            </ul>
          } @else {
            <app-empty-state icon="book" [title]="scope() === 'mine' ? 'Você ainda não tem trilhas' : 'Nenhuma trilha ainda'" message="Crie a primeira trilha: dados gerais, depois os módulos e as aulas.">
              <a appButton routerLink="/sistema/trilhas/nova">Nova trilha</a>
            </app-empty-state>
          }
        }
      }
    </div>
  `,
  styles: `
    .list { display: grid; gap: var(--space-3); }
    .row {
      display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--space-3);
      padding: var(--space-4) var(--space-6); border-radius: var(--radius-lg);
      border: 1px solid var(--line); background: var(--surface-raised); box-shadow: var(--shadow-card);
      color: var(--ink); text-decoration: none;
    }
    .row:hover { border-color: var(--line-strong); }
    .what { display: grid; gap: var(--space-1); min-width: 0; flex: 1 1 280px; }
    .side { display: grid; justify-items: end; gap: var(--space-1); }
  `
})
export class TracksAdminPage {
  private readonly service = inject(TracksService);
  // Administrador: todas as trilhas, sem o filtro "Minhas" (ele não é tutor de nenhuma).
  readonly oversees = inject(SystemSessionService).can('tracks:oversee');

  readonly scopes: SegmentOption<Scope>[] = [
    { value: 'mine', label: 'Minhas' },
    { value: 'all', label: 'Todas' }
  ];
  readonly scope = signal<Scope>(this.oversees ? 'all' : 'mine');

  readonly tracks = new RemoteData(() => this.service.list());
  readonly visible = computed(() => (this.tracks.data() ?? []).filter((t) => this.scope() === 'all' || t.is_tutor));

  readonly duration = formatDuration;
  readonly date = formatDate;

  constructor() {
    this.tracks.load();
  }

  names(t: { tutors: { name: string }[] }): string {
    return t.tutors.map((x) => x.name).join(', ');
  }
}
