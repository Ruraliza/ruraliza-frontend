import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '@env/environment';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  const base = `${environment.apiUrl}/auth`;
  let service: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('logs in with e-mail and password and gets the account session', () => {
    const input = { email: 'maria@exemplo.com', password: 'ruraliza123' };
    const user = { account_id: 2, role: 'worker' as const, id: 3, profiles: { farmer: null, worker: 3 } };
    service.login(input).subscribe((res) => expect(res.user).toEqual(user));

    const req = http.expectOne(`${base}/login`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(input);
    req.flush({ message: 'ok', user });
  });

  it('requests a password reset and then sets the new password with the code from the e-mail', () => {
    service.requestPasswordReset({ email: 'ana@exemplo.com' }).subscribe((res) => expect(res).toEqual({ message: 'ok' }));
    const request = http.expectOne(`${base}/password-reset`);
    expect(request.request.body).toEqual({ email: 'ana@exemplo.com' });
    request.flush({ message: 'ok' });

    service.resetPassword({ token: 'tok', password: 'senha-nova-1' }).subscribe();
    const confirm = http.expectOne(`${base}/password-reset/confirm`);
    expect(confirm.request.method).toBe('POST');
    expect(confirm.request.body).toEqual({ token: 'tok', password: 'senha-nova-1' });
    confirm.flush({ message: 'ok', user: { account_id: 1, role: 'farmer', id: 1, profiles: { farmer: 1, worker: null } } });
  });
});
