import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { CatalogWorker } from '@core/models/matching.model';
import { FarmerService } from '../data-access/farmer.service';
import { CatalogPage } from './catalog-page';

const MARIA: CatalogWorker = {
  id: 7, name: 'Maria Souza', photo_url: null, bio: null, experience: '5 anos', certificates: null,
  reputation: { average: null, count: 0, score: 0, punctuality: null, effort: null, quality: null },
  verified: true, reasons: ['Escolheu Colheita', 'De 5 a 15 km da fazenda']
};

describe('CatalogPage', () => {
  let invited: [number, number][];

  function open(catalog: CatalogWorker[]): HTMLElement {
    invited = [];
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: FarmerService,
          useValue: {
            getService: () => of({ id: 3, category: 'Conserto de cerca' }),
            getCatalog: () => of(catalog),
            invite: (serviceId: number, workerId: number) => { invited.push([serviceId, workerId]); return of({ message: 'ok' }); }
          }
        }
      ]
    });
    const fixture = TestBed.createComponent(CatalogPage);
    fixture.componentRef.setInput('id', '3');
    fixture.detectChanges();
    TestBed.tick();
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('shows the reasons and turns "Convidar" into "Convidado" after the invite', () => {
    const host = open([MARIA]);
    expect(host.textContent).toContain('De 5 a 15 km da fazenda');

    const button = [...host.querySelectorAll('button')].find((b) => b.textContent?.includes('Convidar'));
    button?.click();
    TestBed.tick();

    expect(invited).toEqual([[3, 7]]);
    expect([...host.querySelectorAll('button')].some((b) => b.textContent?.includes('Convidado') && b.disabled)).toBe(true);
  });

  it('explains the empty catalog with the service category', () => {
    const host = open([]);

    expect(host.textContent).toContain('Ninguém com interesse em Conserto de cerca perto da sua fazenda ainda');
  });
});
