import { Component, computed, signal } from '@angular/core';
import { ReportsQueue } from '../ui/reports-queue';
import { VerificationsQueue } from '../ui/verifications-queue';
import { SegmentOption, SegmentedControl } from '@shared/ui/segmented-control';

type Section = 'reports' | 'verifications';

// Moderação (/sistema/moderacao): as duas filas da equipe, denúncias e verificações de identidade.
// As duas ficam montadas (a escondida também), para as abas mostrarem quantas estão esperando.
@Component({
  selector: 'app-moderation-page',
  imports: [ReportsQueue, SegmentedControl, VerificationsQueue],
  template: `
    <div class="container page">
      <div class="page-header">
        <div>
          <h1>Moderação</h1>
          <p class="muted">Denúncias e verificações de identidade. Quem pediu recebe um aviso com a decisão.</p>
        </div>
      </div>

      <app-segmented-control label="Fila" [options]="sections()" [(value)]="section" />
      <app-reports-queue [hidden]="section() !== 'reports'" (pendingCount)="reports.set($event)" />
      <app-verifications-queue [hidden]="section() !== 'verifications'" (pendingCount)="verifications.set($event)" />
    </div>
  `
})
export class ModerationPage {
  readonly section = signal<Section>('reports');
  readonly reports = signal(0);
  readonly verifications = signal(0);

  readonly sections = computed<SegmentOption<Section>[]>(() => [
    { value: 'reports', label: this.reports() ? `Denúncias (${this.reports()})` : 'Denúncias' },
    { value: 'verifications', label: this.verifications() ? `Verificações (${this.verifications()})` : 'Verificações' }
  ]);
}
