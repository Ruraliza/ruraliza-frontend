import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router, provideRouter } from '@angular/router';
import { environment } from '../../../environments/environment';
import { SessionUser } from '../../../models/auth.model';
import { CurrentUserService } from './current-user.service';
import { RoleSwitchService } from './role-switch.service';

describe('RoleSwitchService', () => {
  const farmerOnly: SessionUser = { account_id: 1, role: 'farmer', id: 2, profiles: { farmer: 2, worker: null } };
  const both: SessionUser = { ...farmerOnly, profiles: { farmer: 2, worker: 5 } };
  let service: RoleSwitchService;
  let currentUser: CurrentUserService;
  let http: HttpTestingController;
  let navigate: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(RoleSwitchService);
    currentUser = TestBed.inject(CurrentUserService);
    http = TestBed.inject(HttpTestingController);
    navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
  });

  afterEach(() => http.verify());

  it('invites to create the missing profile, without calling the API', () => {
    currentUser.set(farmerOnly);
    expect(service.labelFor('farmer')).toBe('Quero ser trabalhador');

    service.switchFrom('farmer');
    expect(navigate).toHaveBeenCalledWith('/conta/novo-perfil/trabalhador');
  });

  it('switches to an existing profile and remembers it for the next login', () => {
    currentUser.set(both);
    expect(service.labelFor('farmer')).toBe('Ir para a área do trabalhador');

    service.switchFrom('farmer');
    const req = http.expectOne(`${environment.apiUrl}/accounts/1/active-role`);
    expect(req.request.body).toEqual({ role: 'worker' });
    req.flush({ message: 'ok', user: { ...both, role: 'worker', id: 5 } });

    expect(currentUser.role()).toBe('worker');
    expect(navigate).toHaveBeenCalledWith('/trabalhador');
  });

  it('after deleting one of two profiles, stays signed in with the other', () => {
    currentUser.set(both);
    service.profileRemoved('farmer');

    expect(currentUser.user()).toEqual({ account_id: 1, role: 'worker', id: 5, profiles: { farmer: null, worker: 5 } });
    expect(navigate).toHaveBeenCalledWith('/trabalhador');
  });

  it('after deleting the only profile, signs out', () => {
    currentUser.set(farmerOnly);
    service.profileRemoved('farmer');

    expect(currentUser.user()).toBeNull();
    expect(navigate).toHaveBeenCalledWith('/entrar');
  });
});
