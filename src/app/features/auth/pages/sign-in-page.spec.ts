import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { environment } from '@env/environment';
import { SignInPage } from './sign-in-page';

describe('SignInPage', () => {
  const showTestAccounts = environment.showTestAccounts;
  afterEach(() => { environment.showTestAccounts = showTestAccounts; });

  function setup(): HTMLElement {
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()] });
    const fixture = TestBed.createComponent(SignInPage);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  const NOTES = ['trabalhador@exemplo.com', 'produtor@exemplo.com', 'ambos@exemplo.com', 'admin@exemplo.com', 'ruraliza123'];

  it('mostra as contas de teste com showTestAccounts ligado', () => {
    environment.showTestAccounts = true;
    const text = setup().textContent ?? '';

    for (const note of NOTES) expect(text).toContain(note);
  });

  it('não mostra as contas de teste com showTestAccounts desligado', () => {
    environment.showTestAccounts = false;
    const text = setup().textContent ?? '';

    expect(text).not.toContain('Contas de teste');
    for (const note of NOTES) expect(text).not.toContain(note);
  });

  it('entra com a conta de teste escolhida', () => {
    environment.showTestAccounts = true;
    const el = setup();
    el.querySelector<HTMLButtonElement>('button[aria-label="Entrar como Produtor"]')?.click();

    const req = TestBed.inject(HttpTestingController).expectOne((r) => r.url.endsWith('/auth/login'));
    expect(req.request.body).toEqual({ email: 'produtor@exemplo.com', password: 'ruraliza123' });
  });
});
