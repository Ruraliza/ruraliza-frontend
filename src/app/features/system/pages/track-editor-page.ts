import { Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CategoryService } from '@core/api/category.service';
import { ToastService } from '@core/toast/toast.service';
import { ManagedTrack, TrackContentInput, TrackStatusInput } from '@core/models/track.model';
import { RemoteData, mergeStates } from '@shared/utils/remote-data';
import { formatDate, formatDuration } from '@shared/utils/format';
import { Button } from '@shared/ui/button';
import { ConfirmDialog } from '@shared/ui/confirm-dialog';
import { ErrorState } from '@shared/ui/error-state';
import { Icon } from '@shared/ui/icon';
import { Skeleton } from '@shared/ui/skeleton';
import { TracksService } from '../data-access/tracks.service';
import { TrackContentEditor } from '../ui/track-content-editor';
import { TrackGeneralForm, TrackGeneralValue } from '../ui/track-general-form';
import { TrackStatusBadge } from '../ui/track-status-badge';

interface StatusAction {
  status: TrackStatusInput['status'];
  label: string;
  title: string;
  message: string;
  variant: 'primary' | 'danger';
}

const ACTIONS: Record<ManagedTrack['status'], StatusAction> = {
  draft: {
    status: 'published', label: 'Publicar', variant: 'primary', title: 'Publicar a trilha?',
    message: 'Ela aparece para os trabalhadores das categorias escolhidas. Depois de publicada, não volta para rascunho (mas pode ser descontinuada).'
  },
  published: {
    status: 'discontinued', label: 'Descontinuar', variant: 'danger', title: 'Descontinuar a trilha?',
    message: 'Ela some da lista e não aceita alunos novos. Quem já começou continua até o certificado. Você pode reativar depois.'
  },
  discontinued: {
    status: 'published', label: 'Reativar', variant: 'primary', title: 'Reativar a trilha?',
    message: 'Ela volta a aparecer para os trabalhadores e a aceitar alunos novos.'
  }
};

// Página de uma trilha para os tutores: status, dados gerais e tutores, e o editor de módulos e aulas.
// Edita quem é tutor da trilha ou administrador; os outros tutores veem em modo leitura.
// Não existe excluir: desabilitar é descontinuar.
@Component({
  selector: 'app-track-editor-page',
  imports: [RouterLink, Button, ConfirmDialog, ErrorState, Icon, Skeleton, TrackContentEditor, TrackGeneralForm, TrackStatusBadge],
  template: `
    <div class="container page">
      <a class="back-link" routerLink="/sistema/trilhas"><app-icon name="arrow-left" [size]="20" />Trilhas</a>

      @switch (state().status) {
        @case ('loading') { <app-skeleton [count]="2" [height]="280" /> }
        @case ('error') { <app-error-state [message]="track.error() || categories.error() || tutors.error()" (retry)="load()" /> }
        @case ('success') {
          @if (track.data(); as t) {
            <header class="page-header">
              <div>
                <div class="cluster"><app-track-status-badge [status]="t.status" /></div>
                <h1>{{ t.title }}</h1>
                <p class="muted t-body-sm">{{ t.lesson_count }} {{ t.lesson_count === 1 ? 'aula' : 'aulas' }} · {{ duration(t.workload_minutes) }} · editada em {{ date(t.updated_at) }}</p>
              </div>
              @if (t.can_edit) {
                <button appButton [variant]="action().variant === 'danger' ? 'secondary' : 'primary'" type="button" (click)="confirming.set(true)">{{ action().label }}</button>
              }
            </header>

            @if (!t.can_edit) {
              <p class="card note" role="note"><app-icon name="alert" [size]="20" />Você não é tutor desta trilha: pode ver, mas só os tutores dela editam. Peça a um deles para incluir você.</p>
            } @else if (!t.is_tutor) {
              <p class="card note" role="note"><app-icon name="alert" [size]="20" />Você está editando como administrador. Os tutores da trilha continuam responsáveis por ela.</p>
            } @else if (t.status === 'draft') {
              <p class="card note" role="note"><app-icon name="alert" [size]="20" />Rascunho: os trabalhadores ainda não veem esta trilha. Monte os módulos e as aulas e publique.</p>
            }

            <section class="card stack" aria-labelledby="dados">
              <h2 id="dados" class="t-h3">Dados gerais e tutores</h2>
              <app-track-general-form
                [value]="general()"
                [categories]="categories.data() ?? []"
                [tutors]="tutors.data() ?? []"
                [readonly]="!t.can_edit"
                [saving]="savingGeneral()"
                (submitted)="saveGeneral(t, $event)"
              />
            </section>

            <section class="card stack" aria-labelledby="conteudo">
              <h2 id="conteudo" class="t-h3">Módulos e aulas</h2>
              <app-track-content-editor
                [modules]="t.modules"
                [readonly]="!t.can_edit"
                [live]="t.status !== 'draft'"
                [saving]="savingContent()"
                (save)="saveContent(t, $event)"
              />
            </section>

            <app-confirm-dialog
              [open]="confirming()"
              [title]="action().title"
              [message]="action().message"
              [confirmLabel]="action().label"
              [confirmVariant]="action().variant"
              [loading]="changingStatus()"
              (confirmed)="changeStatus(t)"
              (cancelled)="confirming.set(false)"
            />
          }
        }
      }
    </div>
  `,
  styles: `
    .note { display: flex; align-items: flex-start; gap: var(--space-3); background: var(--bg-alt); }
    .note app-icon { flex: none; margin-top: 2px; color: var(--orange-700); }
  `
})
export class TrackEditorPage {
  readonly id = input.required<string>();

  private readonly service = inject(TracksService);
  private readonly toast = inject(ToastService);

  readonly track = new RemoteData(() => this.service.get(Number(this.id())));
  readonly categories = new RemoteData(() => inject(CategoryService).getCategories());
  readonly tutors = new RemoteData(() => this.service.tutors());
  readonly state = computed(() => mergeStates(this.track.state(), this.categories.state(), this.tutors.state()));

  readonly general = computed(() => {
    const t = this.track.data();
    return t ? { title: t.title, description: t.description, categories: t.categories, tutor_ids: t.tutors.map((x) => x.id) } : null;
  });
  readonly action = computed(() => ACTIONS[this.track.data()?.status ?? 'draft']);

  readonly savingGeneral = signal(false);
  readonly savingContent = signal(false);
  readonly changingStatus = signal(false);
  readonly confirming = signal(false);

  readonly duration = formatDuration;
  readonly date = formatDate;

  constructor() {
    this.categories.load();
    this.tutors.load();
    effect(() => {
      this.id();
      untracked(() => this.track.load());
    });
  }

  load(): void {
    this.track.load();
    this.categories.load();
    this.tutors.load();
  }

  saveGeneral(t: ManagedTrack, value: TrackGeneralValue): void {
    this.savingGeneral.set(true);
    this.service.update(t.id, value).subscribe({
      next: ({ track }) => {
        this.savingGeneral.set(false);
        this.track.replace(track);
        this.toast.success(track.can_edit ? 'Dados da trilha salvos.' : 'Dados salvos. Você não é mais tutor desta trilha.');
      },
      error: () => this.savingGeneral.set(false)
    });
  }

  saveContent(t: ManagedTrack, content: TrackContentInput): void {
    this.savingContent.set(true);
    this.service.saveContent(t.id, content).subscribe({
      next: ({ track }) => {
        this.savingContent.set(false);
        this.track.replace(track);
        this.toast.success('Módulos e aulas salvos.');
      },
      error: () => this.savingContent.set(false)
    });
  }

  changeStatus(t: ManagedTrack): void {
    const action = this.action();
    this.changingStatus.set(true);
    this.service.setStatus(t.id, action.status).subscribe({
      next: ({ track }) => {
        this.changingStatus.set(false);
        this.confirming.set(false);
        this.track.replace(track);
        this.toast.success(action.status === 'published' ? 'Trilha publicada.' : 'Trilha descontinuada.');
      },
      error: () => {
        this.changingStatus.set(false);
        this.confirming.set(false);
      }
    });
  }
}
