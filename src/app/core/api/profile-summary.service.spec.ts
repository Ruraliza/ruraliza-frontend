import { DestroyRef, Injector, effect, runInInjectionContext, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ProfileService } from './profile.service';
import { ProfileSummaryService } from './profile-summary.service';

describe('ProfileSummaryService', () => {
  let destroyCallbacks: (() => void)[];
  const destroyRef = { onDestroy: (fn: () => void) => { destroyCallbacks.push(fn); return () => undefined; } } as DestroyRef;

  // Só o que o serviço lê do perfil (nome e foto).
  function setup(profiles: Record<string, () => unknown>): ProfileSummaryService {
    destroyCallbacks = [];
    TestBed.configureTestingModule({ providers: [{ provide: ProfileService, useValue: profiles }] });
    return TestBed.inject(ProfileSummaryService);
  }

  it('loads the name and photo of the profile in the open area', () => {
    const service = setup({ getFarmer: () => of({ name: 'João Produtor', photo_url: '/api/images/a.webp' }) });

    service.connect('farmer', 1, destroyRef);

    expect(service.summary()).toEqual({ name: 'João Produtor', photo_url: '/api/images/a.webp' });
  });

  it('follows the profile page when the photo changes, ignoring other areas', () => {
    const service = setup({ getWorker: () => of({ name: 'Maria', photo_url: null }) });
    service.connect('worker', 2, destroyRef);

    service.update('worker', 2, { name: 'Maria Trabalhadora', photo_url: '/api/images/b.webp' });
    service.update('farmer', 2, { name: 'Outra pessoa', photo_url: null });

    expect(service.summary()).toEqual({ name: 'Maria Trabalhadora', photo_url: '/api/images/b.webp' });
  });

  it('can be updated from an effect without running it again (the profile page does that)', () => {
    const service = setup({ getFarmer: () => of({ name: 'João', photo_url: null }) });
    service.connect('farmer', 1, destroyRef);
    const page = signal({ name: 'João Produtor', photo_url: null });
    let runs = 0;

    runInInjectionContext(TestBed.inject(Injector), () => effect(() => {
      runs++;
      service.update('farmer', 1, page());
    }));
    TestBed.tick();

    expect(runs).toBe(1);
    expect(service.summary()?.name).toBe('João Produtor');
  });

  it('stays empty without a connection and forgets the profile when the area closes', () => {
    const service = setup({ getWorker: () => throwError(() => new Error('offline')) });
    service.connect('worker', 2, destroyRef);
    expect(service.summary()).toBeNull();

    service.update('worker', 2, { name: 'Maria', photo_url: null });
    destroyCallbacks.forEach((fn) => fn());

    expect(service.summary()).toBeNull();
  });
});
