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
        <h2 id="recommended-title">Vagas para você</h2>
        <a class="adjust" routerLink="/trabalhador/vagas/para-voce">Ver todas<app-icon name="arrow-right" [size]="18" /></a>
      </div>

      @switch (data.state().status) {
        @case ('loading') { <app-skeleton [count]="1" [height]="160" /> }
        @case ('error') { <p class="t-body-sm muted">Não foi possível carregar as sugestões agora.</p> }
        @case ('success') {
          @if (jobs().length) {
            <div class="row">
              @for (job of jobs(); track job.id) {
                <app-service-card [service]="job" [link]="['/trabalhador/vagas', job.id]" [showStatus]="false" [reasons]="job.reasons.slice(0, 1)" />
              }
            </div>
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
    .head { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: var(--space-2) var(--space-4); }
    h2, p { margin: 0; }
    .adjust { display: inline-flex; align-items: center; gap: 2px; min-height: 44px; color: var(--mata); font-weight: 700; text-decoration: none; }
    /* Celular: fileira que rola para o lado, com a próxima vaga aparecendo na borda. Desktop: grade. */
    .row { display: grid; grid-auto-flow: column; grid-auto-columns: min(82%, 320px); gap: var(--space-4); overflow-x: auto; scroll-snap-type: x mandatory; padding-bottom: var(--space-2); margin-inline: calc(-1 * var(--space-4)); padding-inline: var(--space-4); scroll-padding-inline: var(--space-4); }
    .row > * { scroll-snap-align: start; }
    @media (min-width: 768px) { .row { grid-auto-flow: row; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); overflow: visible; margin-inline: 0; padding-inline: 0; } }
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
    forkJoin({ preferences: this.matching.preferences(this.workerId()), jobs: this.matching.recommended(this.workerId(), SHOWN) })
  );

  readonly jobs = computed(() => this.data.data()?.jobs ?? []);
  readonly hasInterests = computed(() => {
    const prefs = this.data.data()?.preferences;
    return !!prefs && (prefs.categories.length > 0 || prefs.near !== null);
  });
  readonly alerts = computed(() => this.data.data()?.preferences.alerts ?? false);

  ngOnInit(): void {
    this.data.load();
  }
}
