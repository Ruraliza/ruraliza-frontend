import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../environments/environment';
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

  it('logs in with role, e-mail and password', () => {
    const input = { role: 'worker' as const, email: 'maria@exemplo.com', password: 'ruraliza123' };
    service.login(input).subscribe((res) => expect(res.user).toEqual({ role: 'worker', id: 3 }));

    const req = http.expectOne(`${base}/login`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(input);
    req.flush({ message: 'ok', user: { role: 'worker', id: 3 } });
  });

  it('requests a password reset and then sets the new password with the token', () => {
    service.requestPasswordReset({ role: 'farmer', email: 'ana@exemplo.com' }).subscribe((res) => expect(res.reset_token).toBe('tok'));
    const request = http.expectOne(`${base}/password-reset`);
    expect(request.request.body).toEqual({ role: 'farmer', email: 'ana@exemplo.com' });
    request.flush({ message: 'ok', reset_token: 'tok' });

    service.resetPassword({ token: 'tok', password: 'senha-nova-1' }).subscribe();
    const confirm = http.expectOne(`${base}/password-reset/confirm`);
    expect(confirm.request.method).toBe('POST');
    expect(confirm.request.body).toEqual({ token: 'tok', password: 'senha-nova-1' });
    confirm.flush({ message: 'ok', user: { role: 'farmer', id: 1 } });
  });
});
