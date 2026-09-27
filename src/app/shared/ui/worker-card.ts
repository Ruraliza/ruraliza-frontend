import { Component, computed, input } from '@angular/core';
import { Worker } from '../../../models/worker.model';
import { ApplicationStatus } from '../../../models/status';
import { StatusBadge } from './status-badge';

// Card de trabalhador (candidato). Ações entram por projeção de conteúdo.
@Component({
  selector: 'app-worker-card',
  imports: [StatusBadge],
  template: `
    <div class="head">
      <span class="avatar" aria-hidden="true">{{ initials() }}</span>
      <div class="who">
        <h3>{{ worker().name }}</h3>
        <p class="t-body-sm muted">CPF {{ worker().cpf }}</p>
      </div>
      @if (status(); as s) { <app-status-badge [status]="s" /> }
    </div>
    <dl class="details">
      <div><dt>Experiência</dt><dd>{{ worker().experience || 'Não informada' }}</dd></div>
      <div><dt>Certificados</dt><dd>{{ worker().certificates || 'Nenhum informado' }}</dd></div>
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
    .avatar {
      display: grid; place-items: center; width: 48px; height: 48px; border-radius: 50%;
      background: var(--broto-soft); color: var(--ink); font: 700 18px/1 var(--font-display);
    }
    .actions { display: flex; flex-wrap: wrap; gap: var(--space-3); }
    .actions:empty { display: none; }
  `
})
export class WorkerCard {
  readonly worker = input.required<Worker>();
  readonly status = input<ApplicationStatus | null>(null);

  readonly initials = computed(() =>
    this.worker()
      .name.split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join('')
  );
}
