import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { FarmerStats } from '@core/models/farm-stats.model';
import { FarmerService } from '../data-access/farmer.service';
import { FarmStatsPanel } from './farm-stats-panel';

const months = (hours: number[]): FarmerStats['months'] =>
  hours.map((h, i) => ({ month: `2026-0${i + 4}`, services: h ? 1 : 0, hours: h, paid: h * 50 }));

const STATS: FarmerStats = {
  services_completed: 3, hours_completed: 30, total_paid: 1500, people_count: 2, returning_people: 1,
  rating: { average: 4.5, count: 4, infrastructure: 4.5, conditions: 4.5, as_described: 4.5 },
  open_jobs: 1, pending_applications: 2, months: months([0, 10, 0, 0, 20, 5]), categories: [],
  people: Array.from({ length: 7 }, (_, i) => ({ worker_id: i + 1, name: `Pessoa ${i + 1}`, photo_url: null, services: 1, hours: 4, last_service_at: '2026-09-01T12:00:00.000Z' }))
};

describe('FarmStatsPanel', () => {
  function render(stats: FarmerStats): { panel: FarmStatsPanel; text: () => string } {
    TestBed.configureTestingModule({ providers: [{ provide: FarmerService, useValue: { getStats: () => of(stats) } }] });
    const fixture = TestBed.createComponent(FarmStatsPanel);
    fixture.componentRef.setInput('farmerId', 1);
    fixture.detectChanges();
    return { panel: fixture.componentInstance, text: () => (fixture.nativeElement as HTMLElement).textContent ?? '' };
  }

  it('draws the months relative to the busiest one and marks the current month', () => {
    const { panel } = render(STATS);

    expect(panel.bars().map((b) => [b.label, Math.round(b.height), b.current])).toEqual([
      ['abr', 0, false], ['mai', 50, false], ['jun', 0, false], ['jul', 0, false], ['ago', 100, false], ['set', 25, true]
    ]);
    expect(panel.paidInPeriod()).toBe(1750);
  });

  it('shows five people and opens the rest on request', () => {
    const { panel } = render(STATS);

    expect(panel.visiblePeople().length).toBe(5);
    panel.allPeople.set(true);
    expect(panel.visiblePeople().length).toBe(7);
  });

  it('explains what will appear before the first finished service', () => {
    const { text } = render({ ...STATS, services_completed: 0, people: [] });

    expect(text()).toContain('Os números aparecem aqui depois do primeiro serviço concluído');
  });
});
