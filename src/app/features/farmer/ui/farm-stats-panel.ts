import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { FarmerService } from '../data-access/farmer.service';
import { FarmerStatsMonth } from '@core/models/farm-stats.model';
import { Avatar } from '@shared/domain/ui/avatar';
import { Icon } from '@shared/ui/icon';
import { Skeleton } from '@shared/ui/skeleton';
import { formatBRL, formatDate } from '@shared/utils/format';
import { RemoteData } from '@shared/utils/remote-data';

const PEOPLE_SHOWN = 5;
const number = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });
const monthName = new Intl.DateTimeFormat('pt-BR', { month: 'short', timeZone: 'UTC' });

function monthLabel(month: string): string {
  const [year = 0, m = 1] = month.split('-').map(Number);
  return monthName.format(new Date(Date.UTC(year, m - 1, 1))).replace('.', '');
}

interface Bar extends FarmerStatsMonth {
  label: string;
  height: number; // % da maior
  current: boolean;
}

// Painel da fazenda no Início do produtor (issue #22): as horas trabalhadas (validadas pelo pagamento),
// a nota que os trabalhadores dão e quem já passou por aqui; as horas dos últimos 6 meses e a lista de
// pessoas. Sem serviço concluído ainda, explica o que vai aparecer.
@Component({
  selector: 'app-farm-stats-panel',
  imports: [Avatar, Icon, Skeleton],
  template: `
    <section class="stack" aria-labelledby="farm-stats-title">
      <div class="stack-sm">
        <h2 id="farm-stats-title">Sua fazenda em números</h2>
        <p class="t-body-sm muted">Contam os serviços concluídos, com o pagamento liberado.</p>
      </div>

      @switch (stats.state().status) {
        @case ('loading') { <app-skeleton [count]="1" [height]="160" /> }
        @case ('error') { <p class="t-body-sm muted">Não foi possível carregar os números agora.</p> }
        @case ('success') {
          @if (stats.data(); as s) {
            @if (s.services_completed === 0) {
              <p class="note">Os números aparecem aqui depois do primeiro serviço concluído: as horas trabalhadas na sua fazenda, a nota que os trabalhadores dão e quem já passou por aqui.</p>
            } @else {
              <dl class="facts card">
                <div>
                  <dt>Horas trabalhadas</dt>
                  <dd><span class="value">{{ num(s.hours_completed) }}</span> em {{ s.services_completed }} {{ s.services_completed === 1 ? 'serviço' : 'serviços' }}</dd>
                </div>
                <div>
                  <dt>Nota da fazenda</dt>
                  @if (s.rating; as r) {
                    <dd><span class="value">{{ num(r.average) }}<app-icon name="star" [size]="22" /></span> em {{ r.count }} {{ r.count === 1 ? 'avaliação' : 'avaliações' }}</dd>
                  } @else {
                    <dd><span class="value">–</span> ainda sem avaliação publicada</dd>
                  }
                </div>
                <div>
                  <dt>Pessoas que passaram por aqui</dt>
                  <dd><span class="value">{{ s.people_count }}</span>{{ s.returning_people ? (s.returning_people === 1 ? ' e 1 voltou' : ' e ' + s.returning_people + ' voltaram') : '' }}</dd>
                </div>
              </dl>

              <figure class="card chart">
                <figcaption>
                  <span class="t-h3">Horas por mês</span>
                  <span class="t-body-sm muted">{{ brl(paidInPeriod()) }} pagos nos últimos 6 meses</span>
                </figcaption>
                <div aria-hidden="true">
                  <div class="bars">
                    @for (bar of bars(); track bar.month) {
                      <div class="col" [class.current]="bar.current">
                        <span class="amount">{{ bar.hours ? num(bar.hours) : '' }}</span>
                        <span class="bar" [style.height.%]="bar.height"></span>
                      </div>
                    }
                  </div>
                  <div class="months">
                    @for (bar of bars(); track bar.month) { <span [class.current]="bar.current">{{ bar.label }}</span> }
                  </div>
                </div>
                <table class="visually-hidden">
                  <caption>Horas trabalhadas, serviços e valor pago por mês</caption>
                  <thead><tr><th scope="col">Mês</th><th scope="col">Horas</th><th scope="col">Serviços</th><th scope="col">Pago</th></tr></thead>
                  <tbody>
                    @for (bar of bars(); track bar.month) {
                      <tr><th scope="row">{{ bar.label }}</th><td>{{ num(bar.hours) }}</td><td>{{ bar.services }}</td><td>{{ brl(bar.paid) }}</td></tr>
                    }
                  </tbody>
                </table>
              </figure>

              <div class="card people">
                <h3 class="t-h3">Quem já passou por aqui</h3>
                <ul role="list">
                  @for (person of visiblePeople(); track person.worker_id) {
                    <li>
                      <app-avatar [name]="person.name" [photoUrl]="person.photo_url" [size]="40" />
                      <span class="who">
                        <b>{{ person.name }}</b>
                        <span class="t-body-sm muted">{{ person.services }} {{ person.services === 1 ? 'serviço' : 'serviços' }}, {{ num(person.hours) }} horas</span>
                      </span>
                      <span class="when t-body-sm muted">último em {{ date(person.last_service_at) }}</span>
                    </li>
                  }
                </ul>
                @if (s.people.length > shown && !allPeople()) {
                  <button type="button" class="more" (click)="allPeople.set(true)">Ver todas as {{ s.people.length }} pessoas</button>
                }
              </div>
            }
          }
        }
      }
    </section>
  `,
  styles: `
    h2, h3, p, dl, dd, figure { margin: 0; }
    .note { padding: var(--space-3) var(--space-4); border-radius: var(--radius-md); background: var(--surface-sunken); font-size: 0.875rem; }
    .facts { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 0; padding: 0; }
    .facts > div { display: grid; gap: var(--space-1); align-content: start; padding: var(--space-4) var(--space-6); }
    .facts > div + div { border-left: 1px solid var(--line); }
    dt { color: var(--ink-muted); font-size: 0.875rem; font-weight: 600; }
    dd { color: var(--ink-muted); font-size: 0.875rem; }
    .value { display: inline-flex; align-items: center; gap: 2px; margin-right: var(--space-1); color: var(--ink); font: 700 1.75rem/2.25rem var(--font-display); font-variant-numeric: tabular-nums; }
    .value app-icon { color: var(--gold-500); }
    .chart { display: grid; gap: var(--space-4); }
    figcaption { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: var(--space-1) var(--space-3); }
    .bars, .months { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: var(--space-3); }
    .bars { height: 168px; border-bottom: 1px solid var(--line-strong); }
    .col { display: flex; flex-direction: column; justify-content: flex-end; align-items: center; gap: var(--space-1); min-width: 0; }
    .bar { width: min(100%, 44px); border-radius: 6px 6px 0 0; background: var(--broto); }
    .current .bar { background: var(--mata); }
    .amount { font-size: 0.8125rem; font-weight: 700; font-variant-numeric: tabular-nums; }
    .months { padding-top: var(--space-2); text-align: center; font-size: 0.8125rem; color: var(--ink-muted); }
    .months .current { color: var(--ink); font-weight: 700; }
    .people { display: grid; gap: var(--space-3); }
    .people ul { display: grid; gap: var(--space-3); margin: 0; padding: 0; list-style: none; }
    .people li { display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: var(--space-3); }
    .who { display: grid; min-width: 0; }
    .who b { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .more { justify-self: start; min-height: 44px; padding: 0; border: 0; background: none; color: var(--mata); font-weight: 600; text-decoration: underline; text-underline-offset: 3px; }
    @media (max-width: 639px) {
      .facts { grid-template-columns: 1fr; }
      .facts > div { padding: var(--space-3) var(--space-4); }
      .facts > div + div { border-left: 0; border-top: 1px solid var(--line); }
      .people li { grid-template-columns: auto 1fr; }
      .when { grid-column: 2; margin-top: calc(-1 * var(--space-2)); }
    }
  `
})
export class FarmStatsPanel implements OnInit {
  readonly farmerId = input.required<number>();

  private readonly farmerService = inject(FarmerService);
  readonly stats = new RemoteData(() => this.farmerService.getStats(this.farmerId()));
  readonly allPeople = signal(false);
  readonly shown = PEOPLE_SHOWN;

  readonly bars = computed<Bar[]>(() => {
    const months = this.stats.data()?.months ?? [];
    const max = Math.max(...months.map((m) => m.hours), 0);
    return months.map((m, i) => ({
      ...m,
      label: monthLabel(m.month),
      height: max === 0 ? 0 : Math.max((m.hours / max) * 100, m.hours > 0 ? 3 : 0),
      current: i === months.length - 1
    }));
  });
  readonly paidInPeriod = computed(() => (this.stats.data()?.months ?? []).reduce((sum, m) => sum + m.paid, 0));
  readonly visiblePeople = computed(() => {
    const people = this.stats.data()?.people ?? [];
    return this.allPeople() ? people : people.slice(0, PEOPLE_SHOWN);
  });

  readonly num = (value: number): string => number.format(value);
  readonly brl = formatBRL;
  readonly date = formatDate;

  ngOnInit(): void {
    this.stats.load();
  }
}
