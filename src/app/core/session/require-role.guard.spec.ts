import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree, provideRouter } from '@angular/router';
import { SessionUser } from '../../../models/auth.model';
import { CurrentUserService } from './current-user.service';
import { requireRole } from './require-role.guard';

describe('requireRole', () => {
  const both: SessionUser = { account_id: 1, role: 'farmer', id: 2, profiles: { farmer: 2, worker: 5 } };

  function run(role: 'farmer' | 'worker'): boolean | UrlTree {
    return TestBed.runInInjectionContext(() =>
      requireRole(role)({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot)
    ) as boolean | UrlTree;
  }

  function url(result: boolean | UrlTree): string {
    return result instanceof UrlTree ? TestBed.inject(Router).serializeUrl(result) : String(result);
  }

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
  });

  it('sends a visitor to the sign-in page', () => {
    expect(url(run('farmer'))).toBe('/entrar');
  });

  it('opens the panel that is already open', () => {
    TestBed.inject(CurrentUserService).set(both);
    expect(run('farmer')).toBe(true);
  });

  it('switches to the other panel when the account has that profile', () => {
    const currentUser = TestBed.inject(CurrentUserService);
    currentUser.set(both);

    expect(run('worker')).toBe(true);
    expect(currentUser.user()).toEqual({ ...both, role: 'worker', id: 5 });
  });

  it('sends an account without that profile to the page that creates it', () => {
    TestBed.inject(CurrentUserService).set({ ...both, profiles: { farmer: 2, worker: null } });
    expect(url(run('worker'))).toBe('/conta/novo-perfil/trabalhador');
  });
});
