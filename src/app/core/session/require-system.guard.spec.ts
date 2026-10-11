import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree, provideRouter } from '@angular/router';
import { SystemRole } from '../models/system.model';
import { requireSystemPermission } from './require-system.guard';
import { SystemPermission, SystemSessionService } from './system-session.service';

describe('requireSystemPermission', () => {
  function run(permission: SystemPermission | readonly SystemPermission[]): string {
    const result = TestBed.runInInjectionContext(() =>
      requireSystemPermission(permission)({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot)
    ) as boolean | UrlTree;
    return result instanceof UrlTree ? TestBed.inject(Router).serializeUrl(result) : String(result);
  }

  function signIn(role: SystemRole): void {
    TestBed.inject(SystemSessionService).signIn({ id: 1, email: 'x@exemplo.com', name: 'X', role, insertion_date: '' }, 'token');
  }

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
  });

  it('sends a visitor to the staff sign-in', () => {
    expect(run('tracks:manage')).toBe('/sistema/entrar');
  });

  it('lets tutors and admins into the tracks screens, each with its own permission', () => {
    const tracks = ['tracks:manage', 'tracks:oversee'] as const;
    signIn('tutor');
    expect(run(tracks)).toBe('true');
    expect(run('users:manage')).toBe('/sistema');

    signIn('admin');
    expect(run(tracks)).toBe('true');
    expect(run('tracks:manage')).toBe('/sistema');
  });
});
