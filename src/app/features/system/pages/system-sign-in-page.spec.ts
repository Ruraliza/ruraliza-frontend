import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { environment } from '@env/environment';
import { SystemSignInPage } from './system-sign-in-page';

describe('SystemSignInPage', () => {
  const production = environment.production;
  afterEach(() => { environment.production = production; });

  function setup(): HTMLElement {
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()] });
    const fixture = TestBed.createComponent(SystemSignInPage);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  // Enquanto o app é só de demonstração, a API cria o administrador de teste também em produção.
  it('mostra o administrador de teste também no build de produção', () => {
    environment.production = true;
    const text = setup().textContent ?? '';

    expect(text).toContain('admin@exemplo.com');
    expect(text).toContain('ruraliza123');
  });

  it('entra com o administrador de teste', () => {
    setup().querySelector<HTMLButtonElement>('button[aria-label="Entrar como Administrador"]')?.click();

    const req = TestBed.inject(HttpTestingController).expectOne((r) => r.url.endsWith('/login'));
    expect(req.request.body).toEqual({ email: 'admin@exemplo.com', password: 'ruraliza123' });
  });
});
