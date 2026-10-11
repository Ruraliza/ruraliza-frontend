import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { of } from 'rxjs';
import { CategoryService } from '@core/api/category.service';
import { TrackTutor } from '@core/models/track.model';
import { SystemSessionService } from '@core/session/system-session.service';
import { ToastService } from '@core/toast/toast.service';
import { RemoteData, mergeStates } from '@shared/utils/remote-data';
import { Button } from '@shared/ui/button';
import { ErrorState } from '@shared/ui/error-state';
import { Icon } from '@shared/ui/icon';
import { Skeleton } from '@shared/ui/skeleton';
import { TracksService } from '../data-access/tracks.service';
import { TrackGeneralForm, TrackGeneralValue } from '../ui/track-general-form';

// Nova trilha: os dados gerais. Ela nasce em rascunho; módulos e aulas vêm na página da trilha.
// O tutor que cria vira tutor dela; o administrador escolhe os tutores responsáveis.
@Component({
  selector: 'app-track-new-page',
  imports: [RouterLink, Button, ErrorState, Icon, Skeleton, TrackGeneralForm],
  template: `
    <div class="container page">
      <a class="back-link" routerLink="/sistema/trilhas"><app-icon name="arrow-left" [size]="20" />Trilhas</a>
      <div class="page-header">
        <div>
          <h1>Nova trilha</h1>
          <p class="muted">
            @if (oversees) { Ela fica em rascunho até ser publicada. Escolha os tutores responsáveis: eles montam as aulas e publicam. }
            @else { Ela fica em rascunho até você publicar. Você entra como tutor e pode chamar colegas depois. }
          </p>
        </div>
      </div>

      @switch (state().status) {
        @case ('loading') { <app-skeleton [count]="1" [height]="360" /> }
        @case ('error') { <app-error-state [message]="categories.error() || tutors.error()" (retry)="load()" /> }
        @case ('success') {
          <div class="card">
            <app-track-general-form
              [categories]="categories.data() ?? []"
              [tutors]="oversees ? tutors.data() : null"
              tutorsHint="Os tutores escolhidos montam as aulas e publicam a trilha. Você, como administrador, também pode editá-la."
              [saving]="saving()"
              [submitLabel]="oversees ? 'Criar trilha' : 'Criar e montar as aulas'"
              (submitted)="create($event)"
            >
              <a appButton variant="secondary" routerLink="/sistema/trilhas">Cancelar</a>
            </app-track-general-form>
          </div>
        }
      }
    </div>
  `
})
export class TrackNewPage {
  private readonly service = inject(TracksService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  // Administrador: não é tutor, então escolhe quem será (a lista de tutores só carrega para ele).
  readonly oversees = inject(SystemSessionService).can('tracks:oversee');
  readonly categories = new RemoteData(() => inject(CategoryService).getCategories());
  readonly tutors = new RemoteData<TrackTutor[]>(() => (this.oversees ? this.service.tutors() : of([])));
  readonly state = computed(() => mergeStates(this.categories.state(), this.tutors.state()));
  readonly saving = signal(false);

  constructor() {
    this.load();
  }

  load(): void {
    this.categories.load();
    this.tutors.load();
  }

  create({ title, description, categories, tutor_ids }: TrackGeneralValue): void {
    this.saving.set(true);
    this.service.create({ title, description, categories, ...(this.oversees ? { tutor_ids } : {}) }).subscribe({
      next: ({ track }) => {
        this.toast.success(this.oversees ? 'Trilha criada em rascunho para os tutores escolhidos.' : 'Trilha criada em rascunho. Agora monte os módulos e as aulas.');
        void this.router.navigate(['/sistema/trilhas', track.id]);
      },
      error: () => this.saving.set(false) // a mensagem já saiu no toast
    });
  }
}
