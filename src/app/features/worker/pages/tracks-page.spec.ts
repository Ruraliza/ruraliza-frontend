import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { CategoryService } from '@core/api/category.service';
import { TrackFilters, WorkerTrackSummary } from '@core/models/track.model';
import { CurrentUserService } from '@core/session/current-user.service';
import { LearningService } from '../data-access/learning.service';
import { TracksPage } from './tracks-page';

const GROUPS = [
  { name: 'Lavoura e horta', services: ['Colheita', 'Plantio'] },
  { name: 'Animais', services: ['Manejo de gado', 'Ordenha'] },
  { name: 'Máquinas', services: ['Operação de máquinas'] }
];

const track = (id: number, title: string, categories: string[]): WorkerTrackSummary => ({
  id, title, description: '', categories, status: 'published', tutors: [], workload_minutes: 60,
  module_count: 1, lesson_count: 1, published_at: '2026-10-01T12:00:00.000Z', progress: null
});

const TRACKS = [track(1, 'Café', ['Colheita']), track(2, 'Gado de leite', ['Manejo de gado', 'Ordenha']), track(3, 'Trator', ['Operação de máquinas', 'Plantio'])];

describe('TracksPage', () => {
  let sent: TrackFilters[];

  function open(params: { grupo?: string; categoria?: string }): TracksPage {
    sent = [];
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: CategoryService, useValue: { getGroups: () => of(GROUPS) } },
        { provide: CurrentUserService, useValue: { requireId: () => 4 } },
        {
          provide: LearningService,
          useValue: {
            listTracks: (filters: TrackFilters) => {
              sent.push(filters);
              return of(filters.category ? TRACKS.filter((t) => t.categories.includes(filters.category as string)) : TRACKS);
            }
          }
        }
      ]
    });
    const fixture = TestBed.createComponent(TracksPage);
    if (params.grupo) fixture.componentRef.setInput('grupo', params.grupo);
    if (params.categoria) fixture.componentRef.setInput('categoria', params.categoria);
    fixture.detectChanges();
    TestBed.tick();
    return fixture.componentInstance;
  }

  it('keeps the tracks with any service of the chosen group', () => {
    const page = open({ grupo: 'Lavoura e horta' });

    expect(page.others().map((t) => t.title)).toEqual(['Café', 'Trator']);
    expect(sent.at(-1)?.category).toBeUndefined();
  });

  it('sends the chosen service to the API and finds its group', () => {
    const page = open({ categoria: 'Ordenha' });

    expect(sent.at(-1)?.category).toBe('Ordenha');
    expect(page.activeGroup()?.name).toBe('Animais');
    expect(page.others().map((t) => t.title)).toEqual(['Gado de leite']);
  });

  it('shows everything without a group', () => {
    const page = open({});

    expect(page.others()).toHaveLength(3);
  });
});
