import { Component, input, output, signal } from '@angular/core';
import { Icon } from '@shared/ui/icon';
import { Worker } from '@core/models/worker.model';
import { ApplicationStatus } from '@core/models/status';
import { WorkerReputation } from '@core/models/review.model';
import { RatingBadge } from '@shared/domain/ui/rating-badge';
import { Avatar } from '@shared/domain/ui/avatar';
import { ResumeDialog } from '@shared/domain/ui/resume-dialog';
import { StatusBadge } from '@shared/domain/ui/status-badge';
import { VerifiedBadge } from '@shared/domain/ui/verified-badge';

// Card de trabalhador (candidato). Ações entram por projeção de conteúdo; `reportable` mostra o
// "Denunciar" no rodapé (o produtor denuncia quem se candidatou a um serviço dele).
@Component({
  selector: 'app-worker-card',
  imports: [Avatar, Icon, RatingBadge, ResumeDialog, StatusBadge, VerifiedBadge],
  template: `
    <div class="head">
      <app-avatar [name]="worker().name" [photoUrl]="worker().photo_url" [size]="56" />
      <div class="who">
        <h3>{{ worker().name }}</h3>
        @if (verified()) { <app-verified-badge /> }
        @if (reputation(); as rep) {
          <p class="rating">
            <app-rating-badge [reputation]="rep" />
            @if (rep.count > 0) { <button type="button" class="link" (click)="viewReviews.emit()">Ver avaliações</button> }
          </p>
        }
      </div>
      @if (status(); as s) { <app-status-badge [status]="s" /> }
    </div>
    @if (worker().bio; as bio) { <p class="bio">{{ bio }}</p> }
    <dl class="details">
      <div><dt>Experiência</dt><dd>{{ worker().experience || 'Não informada' }}</dd></div>
      <div><dt>Certificados</dt><dd>{{ worker().certificates || 'Nenhum informado' }}</dd></div>
      <div><dt>Cursos</dt><dd>{{ worker().courses || 'Nenhum informado' }}</dd></div>
      <div>
        <dt>Currículo</dt>
        <dd>
          @if (worker().resume_url) {
            <button type="button" class="link" (click)="viewingResume.set(true)">Ver currículo (PDF)</button>
          } @else { Não enviado }
        </dd>
      </div>
    </dl>
    <div class="actions"><ng-content /></div>
    @if (reportable()) {
      <button type="button" class="report t-body-sm" (click)="report.emit()"><app-icon name="flag" [size]="16" />Denunciar</button>
    }
    <app-resume-dialog [url]="viewingResume() ? worker().resume_url : null" [name]="worker().name" (closed)="viewingResume.set(false)" />
  `,
  styles: `
    :host {
      display: grid; gap: var(--space-4); padding: var(--space-6);
      background: var(--surface-raised); border: 1px solid var(--line);
      border-radius: var(--radius-lg); box-shadow: var(--shadow-card);
    }
    .head { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-3); }
    .who { flex: 1; min-width: 160px; display: grid; gap: 2px; justify-items: start; }
    .rating { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-1) var(--space-3); margin: 0; }
    .bio { color: var(--ink); white-space: pre-line; }
    dd { white-space: pre-line; }
    .actions { display: flex; flex-wrap: wrap; gap: var(--space-3); }
    .actions:empty { display: none; }
    .report {
      justify-self: end; display: inline-flex; align-items: center; gap: var(--space-1); min-height: 44px; margin: calc(-1 * var(--space-3)) 0;
      padding: 0 var(--space-1); border: 0; background: none; color: var(--ink-muted); font-weight: 600;
    }
    .report:hover { color: var(--danger); }
    .link {
      padding: 0; border: 0; background: none; color: var(--mata);
      text-decoration: underline; text-underline-offset: 3px; font-weight: 600;
    }
  `
})
export class WorkerCard {
  readonly worker = input.required<Worker>();
  readonly status = input<ApplicationStatus | null>(null);
  readonly reputation = input<WorkerReputation | null>(null);
  readonly reportable = input(false);
  readonly verified = input(false);
  readonly viewReviews = output<void>();
  readonly report = output<void>();

  readonly viewingResume = signal(false);
}
