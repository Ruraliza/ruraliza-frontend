import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CategoryService } from '@core/api/category.service';
import { ToastService } from '@core/toast/toast.service';
import { RemoteData } from '@shared/utils/remote-data';
import { Button } from '@shared/ui/button';
import { ErrorState } from '@shared/ui/error-state';
import { Icon } from '@shared/ui/icon';
import { Skeleton } from '@shared/ui/skeleton';
import { TracksService } from '../data-access/tracks.service';
import { TrackGeneralForm, TrackGeneralValue } from '../ui/track-general-form';

// Nova trilha: os dados gerais. Ela nasce em rascunho; módulos e aulas vêm na página da trilha.
@Component({
  selector: 'app-track-new-page',
  imports: [RouterLink, Button, ErrorState, Icon, Skeleton, TrackGeneralForm],
  template: `
    <div class="container page">
      <a class="back-link" routerLink="/sistema/trilhas"><app-icon name="arrow-left" [size]="20" />Trilhas</a>
      <div class="page-header">
        <div>
          <h1>Nova trilha</h1>
          <p class="muted">Ela fica em rascunho até você publicar. Você entra como tutor e pode chamar colegas depois.</p>
        </div>
      </div>

      @switch (categories.state().status) {
        @case ('loading') { <app-skeleton [count]="1" [height]="360" /> }
        @case ('error') { <app-error-state [message]="categories.error()" (retry)="categories.load()" /> }
        @case ('success') {
          <div class="card">
            <app-track-general-form [categories]="categories.data() ?? []" [saving]="saving()" submitLabel="Criar e montar as aulas" (submitted)="create($event)">
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

  readonly categories = new RemoteData(() => inject(CategoryService).getCategories());
  readonly saving = signal(false);

  constructor() {
    this.categories.load();
  }

  create({ title, description, categories }: TrackGeneralValue): void {
    this.saving.set(true);
    this.service.create({ title, description, categories }).subscribe({
      next: ({ track }) => {
        this.toast.success('Trilha criada em rascunho. Agora monte os módulos e as aulas.');
        void this.router.navigate(['/sistema/trilhas', track.id]);
      },
      error: () => this.saving.set(false) // a mensagem já saiu no toast
    });
  }
}
