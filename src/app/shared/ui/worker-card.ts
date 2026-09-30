import { Component, input } from '@angular/core';
import { Worker } from '../../../models/worker.model';
import { ApplicationStatus } from '../../../models/status';
import { Avatar } from './avatar';
import { StatusBadge } from './status-badge';

// Card de trabalhador (candidato). Ações entram por projeção de conteúdo.
@Component({
  selector: 'app-worker-card',
  imports: [Avatar, StatusBadge],
  template: `
    <div class="head">
      <app-avatar [name]="worker().name" [photoUrl]="worker().photo_url" [size]="56" />
      <div class="who">
        <h3>{{ worker().name }}</h3>
        <p class="t-body-sm muted">CPF {{ worker().cpf }}</p>
      </div>
      @if (status(); as s) { <app-status-badge [status]="s" /> }
    </div>
    @if (worker().bio; as bio) { <p class="bio">{{ bio }}</p> }
    <dl class="details">
      <div><dt>Experiência</dt><dd>{{ worker().experience || 'Não informada' }}</dd></div>
      <div><dt>Certificados</dt><dd>{{ worker().certificates || 'Nenhum informado' }}</dd></div>
      <div><dt>Cursos</dt><dd>{{ worker().courses || 'Nenhum informado' }}</dd></div>
    </dl>
    <div class="actions"><ng-content /></div>
  `,
  styles: `
    :host {
      display: grid; gap: var(--space-4); padding: var(--space-6);
      background: var(--surface-raised); border: 1px solid var(--line);
      border-radius: var(--radius-lg); box-shadow: var(--shadow-card);
    }
    .head { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-3); }
    .who { flex: 1; min-width: 160px; display: grid; }
    .bio { color: var(--ink); white-space: pre-line; }
    dd { white-space: pre-line; }
    .actions { display: flex; flex-wrap: wrap; gap: var(--space-3); }
    .actions:empty { display: none; }
  `
})
export class WorkerCard {
  readonly worker = input.required<Worker>();
  readonly status = input<ApplicationStatus | null>(null);
}
