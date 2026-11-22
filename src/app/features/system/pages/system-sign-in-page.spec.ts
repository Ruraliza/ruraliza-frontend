import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { environment } from '@env/environment';
import { SystemSignInPage } from './system-sign-in-page';

describe('SystemSignInPage', () => {
  const showTestAccounts = environment.showTestAccounts;
  afterEach(() => { environment.showTestAccounts = showTestAccounts; });

  function setup(): HTMLElement {
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()] });
    const fixture = TestBed.createComponent(SystemSignInPage);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('mostra o administrador de teste com showTestAccounts ligado', () => {
    environment.showTestAccounts = true;
    const text = setup().textContent ?? '';

    expect(text).toContain('admin@exemplo.com');
    expect(text).toContain('ruraliza123');
  });

  it('não mostra o administrador de teste com showTestAccounts desligado', () => {
    environment.showTestAccounts = false;
    const text = setup().textContent ?? '';

    expect(text).not.toContain('admin@exemplo.com');
    expect(text).not.toContain('ruraliza123');
  });

  it('entra com o administrador de teste', () => {
    environment.showTestAccounts = true;
    setup().querySelector<HTMLButtonElement>('button[aria-label="Entrar como Administrador"]')?.click();

    const req = TestBed.inject(HttpTestingController).expectOne((r) => r.url.endsWith('/login'));
    expect(req.request.body).toEqual({ email: 'admin@exemplo.com', password: 'ruraliza123' });
  });
});
