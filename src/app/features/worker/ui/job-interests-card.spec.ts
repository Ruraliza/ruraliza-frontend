import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { CategoryService } from '@core/api/category.service';
import { JobPreferences } from '@core/models/matching.model';
import { MatchingService } from '../data-access/matching.service';
import { JobInterestsCard } from './job-interests-card';

describe('JobInterestsCard', () => {
  let saved: JobPreferences[];

  function render(current: JobPreferences): JobInterestsCard {
    saved = [];
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: CategoryService, useValue: { getCategories: () => of(['Colheita', 'Plantio', 'Manejo de gado']) } },
        {
          provide: MatchingService,
          useValue: {
            preferences: () => of(current),
            savePreferences: (_id: number, prefs: JobPreferences) => {
              saved.push(prefs);
              return of({ message: 'ok', preferences: { ...prefs, near: prefs.near && { ...prefs.near, latitude: -22.12 } } });
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
    return fixture.componentInstance;
  }

  it('fills the form with what was saved', () => {
    const card = render({ categories: ['Plantio'], near: { latitude: -22.12, longitude: -43.21, radius_km: 50 }, alerts: true });

    expect([card.chosen(), card.radius(), card.alerts()]).toEqual([['Plantio'], '50', true]);
  });

  it('toggles the categories and saves everything at once', () => {
    const card = render({ categories: ['Plantio'], near: null, alerts: false });

    card.toggle('Colheita');
    card.toggle('Plantio');
    card.alerts.set(true);
    card.save();

    expect(saved).toEqual([{ categories: ['Colheita'], near: null, alerts: true }]);
  });

  it('changes the radius only when "perto de mim" is on', () => {
    const card = render({ categories: [], near: { latitude: -22.12, longitude: -43.21, radius_km: 30 }, alerts: false });

    card.setRadius('100');

    expect(card.near()?.radius_km).toBe(100);
  });
});
