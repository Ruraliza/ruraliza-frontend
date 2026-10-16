import { Component, OnInit, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { MatchingService } from '../data-access/matching.service';
import { Button } from '@shared/ui/button';
import { Icon } from '@shared/ui/icon';
import { ServiceCard } from '@shared/domain/ui/service-card';
import { Skeleton } from '@shared/ui/skeleton';
import { RemoteData } from '@shared/utils/remote-data';

const SHOWN = 3;

// "Vagas para você" no Início do trabalhador (issue #23): as 3 que mais combinam, com os motivos.
// Sem interesses escolhidos, convida a escolher; com interesses e nada que combine, diz o que acontece.
@Component({
  selector: 'app-recommended-jobs',
  imports: [RouterLink, Button, Icon, ServiceCard, Skeleton],
  template: `
    <section class="stack" aria-labelledby="recommended-title">
      <div class="head">
        <div class="stack-sm">
          <h2 id="recommended-title">Vagas para você</h2>
          <p class="t-body-sm muted">Pelo que você escolheu em seus interesses, pelas trilhas que faz e pelas vagas em que se candidatou.</p>
        </div>
        <a class="adjust t-body-sm" routerLink="/trabalhador/perfil" fragment="interesses">Ajustar interesses</a>
      </div>

      @switch (data.state().status) {
        @case ('loading') { <app-skeleton [count]="1" [height]="160" /> }
        @case ('error') { <p class="t-body-sm muted">Não foi possível carregar as sugestões agora.</p> }
        @case ('success') {
          @if (jobs().length) {
            <div class="grid-cards">
              @for (job of jobs(); track job.id) {
                <app-service-card [service]="job" [link]="['/trabalhador/vagas', job.id]" [showStatus]="false" [reasons]="job.reasons" />
              }
            </div>
            @if (more()) {
              <div><a appButton variant="secondary" routerLink="/trabalhador/vagas/para-voce">Ver todas as vagas para você</a></div>
            }
          } @else if (hasInterests()) {
            <p class="note">Nenhuma vaga aberta combina com você agora. Quando abrir uma, ela aparece aqui{{ alerts() ? ' e você recebe um aviso' : '' }}.</p>
          } @else {
            <div class="invite">
              <app-icon name="sprout" [size]="28" />
              <div class="stack-sm">
                <p><b>Diga o que você quer fazer</b> e onde está: o app separa as vagas que combinam e pode avisar quando abrir uma nova.</p>
                <div><a appButton routerLink="/trabalhador/perfil" fragment="interesses">Escolher interesses</a></div>
              </div>
            </div>
          }
        }
      }
    </section>
  `,
  styles: `
    .head { display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: space-between; gap: var(--space-2) var(--space-4); }
    h2, p { margin: 0; }
    .adjust { color: var(--mata); font-weight: 600; text-underline-offset: 3px; }
    .note { padding: var(--space-3) var(--space-4); border-radius: var(--radius-md); background: var(--surface-sunken); font-size: 0.875rem; }
    .invite {
      display: flex; gap: var(--space-4); align-items: flex-start; padding: var(--space-6);
      border: 1px dashed var(--line-strong); border-radius: var(--radius-lg); background: var(--surface-raised);
    }
    .invite app-icon { flex: none; color: var(--mata); }
  `
})
export class RecommendedJobs implements OnInit {
  readonly workerId = input.required<number>();

  private readonly matching = inject(MatchingService);
  readonly data = new RemoteData(() =>
    forkJoin({ preferences: this.matching.preferences(this.workerId()), jobs: this.matching.recommended(this.workerId(), SHOWN + 1) })
  );

  readonly jobs = computed(() => (this.data.data()?.jobs ?? []).slice(0, SHOWN));
  readonly more = computed(() => (this.data.data()?.jobs.length ?? 0) > SHOWN);
  readonly hasInterests = computed(() => {
    const prefs = this.data.data()?.preferences;
    return !!prefs && (prefs.categories.length > 0 || prefs.near !== null);
  });
  readonly alerts = computed(() => this.data.data()?.preferences.alerts ?? false);

  ngOnInit(): void {
    this.data.load();
  }
}
