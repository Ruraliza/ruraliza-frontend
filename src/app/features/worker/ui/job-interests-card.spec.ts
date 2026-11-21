import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { CategoryService } from '@core/api/category.service';
import { JobPreferences, JobPreferencesInput } from '@core/models/matching.model';
import { MatchingService } from '../data-access/matching.service';
import { JobInterestsCard } from './job-interests-card';

describe('JobInterestsCard', () => {
  let saved: JobPreferencesInput[];

  let host: HTMLElement;
  const click = (label: string, group: string): void => {
    const details = [...host.querySelectorAll('details')].find((d) => d.querySelector('summary')?.textContent?.includes(group));
    const button = [...(details?.querySelectorAll('button') ?? [])].find((b) => b.textContent?.trim() === label);
    button?.click();
  };

  function render(current: JobPreferences): JobInterestsCard {
    saved = [];
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: CategoryService,
          useValue: { getGroups: () => of([{ name: 'Lavoura e horta', services: ['Colheita', 'Plantio'] }, { name: 'Animais', services: ['Manejo de gado', 'Ordenha'] }]) }
        },
        {
          provide: MatchingService,
          useValue: {
            preferences: () => of(current),
            savePreferences: (_id: number, prefs: JobPreferencesInput) => {
              saved.push(prefs);
              return of({ message: 'ok', preferences: { catalog: true, ...prefs, near: prefs.near && { ...prefs.near, latitude: -22.12 } } });
            }
          }
        }
      ]
    });
    const fixture = TestBed.createComponent(JobInterestsCard);
    fixture.componentRef.setInput('workerId', 4);
    fixture.detectChanges();
    TestBed.tick();
    fixture.detectChanges();
    host = fixture.nativeElement as HTMLElement;
    return fixture.componentInstance;
  }

  it('fills the form with what was saved', () => {
    const card = render({ categories: ['Plantio'], near: { latitude: -22.12, longitude: -43.21, radius_km: 50 }, alerts: true, catalog: false });

    expect([card.chosen(), card.radius(), card.alerts(), card.catalog()]).toEqual([['Plantio'], '50', true, false]);
  });

  it('toggles services and whole groups and saves everything at once', () => {
    const card = render({ categories: ['Plantio'], near: null, alerts: false, catalog: true });

    click('Colheita', 'Lavoura e horta');
    click('Plantio', 'Lavoura e horta');
    click('Todo o grupo', 'Animais');
    card.alerts.set(true);
    card.save();

    expect(saved).toEqual([{ categories: ['Colheita', 'Manejo de gado', 'Ordenha'], near: null, alerts: true, catalog: true }]);
  });

  it('unmarks the whole group when all of it is chosen', () => {
    const card = render({ categories: ['Manejo de gado', 'Ordenha', 'Colheita'], near: null, alerts: false, catalog: true });

    click('Todo o grupo', 'Animais');

    expect(card.chosen()).toEqual(['Colheita']);
  });

  it('changes the radius only when "perto de mim" is on', () => {
    const card = render({ categories: [], near: { latitude: -22.12, longitude: -43.21, radius_km: 30 }, alerts: false, catalog: true });

    card.setRadius('100');

    expect(card.near()?.radius_km).toBe(100);
  });

  it('turns the catalog off and saves it', () => {
    const card = render({ categories: ['Plantio'], near: null, alerts: false, catalog: true });

    expect(host.textContent).toContain('Seu perfil aparece para produtores que publicam vagas nas categorias que você escolheu.');
    card.catalog.set(false);
    card.save();

    expect(saved).toEqual([{ categories: ['Plantio'], near: null, alerts: false, catalog: false }]);
  });
});
