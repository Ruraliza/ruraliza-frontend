import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '@env/environment';
import { AccountService } from './account.service';

describe('AccountService', () => {
  const base = `${environment.apiUrl}/accounts`;
  const user = { account_id: 2, role: 'worker' as const, id: 7, profiles: { farmer: 1, worker: 7 } };
  let service: AccountService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(AccountService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('creates the other profile in the same account', () => {
    const input = { role: 'worker' as const, name: 'Ana', phone: '24999990000', cpf: '52998224725', experience: null, certificates: null };
    service.createProfile(2, input).subscribe((res) => expect(res.user).toEqual(user));

    const req = http.expectOne(`${base}/2/profiles`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(input);
    req.flush({ message: 'ok', user });
  });

  it('switches the open panel', () => {
    service.setActiveRole(2, 'farmer').subscribe();

    const req = http.expectOne(`${base}/2/active-role`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ role: 'farmer' });
    req.flush({ message: 'ok', user: { ...user, role: 'farmer', id: 1 } });
  });
});
