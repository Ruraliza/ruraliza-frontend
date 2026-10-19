import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { environment } from '@env/environment';
import { SignInPage } from './sign-in-page';

describe('SignInPage', () => {
  const production = environment.production;
  afterEach(() => { environment.production = production; });

  function setup(): HTMLElement {
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()] });
    const fixture = TestBed.createComponent(SignInPage);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  // Enquanto o app é só de demonstração, a API cria as contas de teste também em produção.
  it('mostra as contas de teste também no build de produção', () => {
    environment.production = true;
    const text = setup().textContent ?? '';

    for (const email of ['trabalhador@exemplo.com', 'produtor@exemplo.com', 'ambos@exemplo.com', 'admin@exemplo.com', 'ruraliza123']) {
      expect(text).toContain(email);
    }
  });

  it('entra com a conta de teste escolhida', () => {
    const el = setup();
    el.querySelector<HTMLButtonElement>('button[aria-label="Entrar como Produtor"]')?.click();

    const req = TestBed.inject(HttpTestingController).expectOne((r) => r.url.endsWith('/auth/login'));
    expect(req.request.body).toEqual({ email: 'produtor@exemplo.com', password: 'ruraliza123' });
  });
});
