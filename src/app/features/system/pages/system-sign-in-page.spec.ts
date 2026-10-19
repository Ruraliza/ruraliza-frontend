import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { environment } from '@env/environment';
import { SystemSignInPage } from './system-sign-in-page';

describe('SystemSignInPage', () => {
  const production = environment.production;
  afterEach(() => { environment.production = production; });

  function render(): string {
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()] });
    const fixture = TestBed.createComponent(SystemSignInPage);
    fixture.detectChanges();
    return (fixture.nativeElement as HTMLElement).textContent ?? '';
  }

  // O administrador de teste só existe no seed do `npm run dev` da API; o build publicado não o mostra.
  it('não mostra a credencial de administrador no build de produção', () => {
    environment.production = true;
    const text = render();

    expect(text).not.toContain('admin@exemplo.com');
    expect(text).not.toContain('ruraliza123');
  });

  it('mostra a credencial de teste em desenvolvimento', () => {
    environment.production = false;

    expect(render()).toContain('admin@exemplo.com');
  });
});
