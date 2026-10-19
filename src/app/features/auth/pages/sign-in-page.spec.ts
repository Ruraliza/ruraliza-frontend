import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { environment } from '@env/environment';
import { SignInPage } from './sign-in-page';

describe('SignInPage', () => {
  const production = environment.production;
  afterEach(() => { environment.production = production; });

  function render(): string {
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()] });
    const fixture = TestBed.createComponent(SignInPage);
    fixture.detectChanges();
    return (fixture.nativeElement as HTMLElement).textContent ?? '';
  }

  // As contas de teste só existem no seed do `npm run dev` da API; o build publicado não as mostra.
  it('não mostra as contas de teste no build de produção', () => {
    environment.production = true;
    const text = render();

    expect(text).not.toContain('produtor@exemplo.com');
    expect(text).not.toContain('ruraliza123');
  });

  it('mostra as contas de teste em desenvolvimento', () => {
    environment.production = false;

    expect(render()).toContain('produtor@exemplo.com');
  });
});
