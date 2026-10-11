import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CurrentUserService } from '@core/session/current-user.service';
import { RemoteData } from '@shared/utils/remote-data';
import { formatDate, formatDuration } from '@shared/utils/format';
import { Button } from '@shared/ui/button';
import { EmptyState } from '@shared/ui/empty-state';
import { ErrorState } from '@shared/ui/error-state';
import { Icon } from '@shared/ui/icon';
import { Skeleton } from '@shared/ui/skeleton';
import { LearningService } from '../data-access/learning.service';

// Certificados das trilhas concluídas.
@Component({
  selector: 'app-certificates-page',
  imports: [RouterLink, Button, EmptyState, ErrorState, Icon, Skeleton],
  template: `
    <div class="container page">
      <a class="back-link" routerLink="/trabalhador/trilhas"><app-icon name="arrow-left" [size]="20" />Trilhas</a>
      <div class="page-header"><div><h1>Meus certificados</h1></div></div>

      @switch (certificates.state().status) {
        @case ('loading') { <app-skeleton [count]="2" [height]="96" /> }
        @case ('error') { <app-error-state [message]="certificates.error()" (retry)="certificates.load()" /> }
        @case ('success') {
          @if (certificates.data()?.length) {
            <ul class="list" role="list">
              @for (c of certificates.data(); track c.code) {
                <li>
                  <a class="row" [routerLink]="['/trabalhador/certificados', c.code]">
                    <span class="badge" aria-hidden="true"><app-icon name="award" /></span>
                    <span class="what">
                      <span class="t-h3">{{ c.track_title }}</span>
                      <span class="t-body-sm muted">{{ duration(c.workload_minutes) }} · concluída em {{ date(c.completed_at) }}</span>
                    </span>
                    <app-icon name="arrow-right" [size]="20" />
                  </a>
                </li>
              }
            </ul>
          } @else {
            <app-empty-state icon="award" title="Nenhum certificado ainda" message="Conclua todas as aulas de uma trilha para receber o certificado da Ruraliza.">
              <a appButton routerLink="/trabalhador/trilhas">Ver trilhas</a>
            </app-empty-state>
          }
        }
      }
    </div>
  `,
  styles: `
    .list { display: grid; gap: var(--space-3); }
    .row {
      display: grid; grid-template-columns: auto minmax(0, 1fr) auto; align-items: center; gap: var(--space-4);
      padding: var(--space-4) var(--space-6); border-radius: var(--radius-lg);
      border: 1px solid var(--line); background: var(--surface-raised); box-shadow: var(--shadow-card);
      color: var(--ink); text-decoration: none;
    }
    .row:hover { border-color: var(--line-strong); }
    .badge { display: grid; place-items: center; width: 48px; height: 48px; border-radius: 50%; background: var(--orange-100); color: var(--orange-700); }
    .what { display: grid; gap: var(--space-1); }
  `
})
export class CertificatesPage {
  private readonly learning = inject(LearningService);
  private readonly workerId = inject(CurrentUserService).requireId('worker');

  readonly certificates = new RemoteData(() => this.learning.getCertificates(this.workerId));
  readonly duration = formatDuration;
  readonly date = formatDate;

  constructor() {
    this.certificates.load();
  }
}
