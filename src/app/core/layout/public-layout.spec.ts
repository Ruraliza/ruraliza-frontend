import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CurrentUserService } from '@core/session/current-user.service';
import { SystemSessionService } from '@core/session/system-session.service';
import { PublicLayout } from './public-layout';

// Links do header (desktop) e do rodapé, como "texto -> href".
async function links(): Promise<Record<string, string | null>> {
  const fixture = TestBed.createComponent(PublicLayout);
  await fixture.whenStable();
  const anchors = (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLAnchorElement>('.actions a, .footer-links a');
  return Object.fromEntries([...anchors].map((a) => [a.textContent.trim(), a.getAttribute('href')]));
}

describe('PublicLayout', () => {
  beforeEach(async () => {
    sessionStorage.clear();
    await TestBed.configureTestingModule({ imports: [PublicLayout], providers: [provideRouter([])] }).compileComponents();
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it('offers sign-in and signup to visitors, and the staff access in the footer', async () => {
    const found = await links();

    expect(found['Entrar']).toBe('/entrar');
    expect(found['Criar conta']).toBe('/cadastro');
    expect(found['Dashboard']).toBeUndefined();
    expect(found['Acesso da equipe']).toBe('/sistema/entrar');
  });

  it('replaces sign-in and signup with the dashboard of the open profile', async () => {
    TestBed.inject(CurrentUserService).signIn({ account_id: 1, role: 'worker', id: 7, profiles: { farmer: null, worker: 7 } }, 'token');

    const found = await links();

    expect(found['Dashboard']).toBe('/trabalhador');
    expect(found['Entrar']).toBeUndefined();
    expect(found['Criar conta']).toBeUndefined();
  });

  it('sends a staff-only session to the system area', async () => {
    TestBed.inject(SystemSessionService).signIn({ id: 1, email: 'admin@exemplo.com', name: 'Admin', role: 'admin', insertion_date: '2026-01-01T00:00:00.000Z' }, 'token');

    const found = await links();

    expect(found['Dashboard']).toBe('/sistema');
    expect(found['Entrar']).toBeUndefined();
  });
});
