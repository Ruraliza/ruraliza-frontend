import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { SessionUser } from '../../../models/auth.model';
import { SystemUser } from '../../../models/system.model';
import { CurrentUserService } from '../session/current-user.service';
import { SystemSessionService } from '../session/system-session.service';
import { authInterceptor } from './auth.interceptor';

const account: SessionUser = { account_id: 1, role: 'farmer', id: 3, profiles: { farmer: 3, worker: null } };
const admin: SystemUser = { id: 1, email: 'admin@exemplo.com', name: 'Ana', role: 'admin', insertion_date: '2026-01-01T00:00:00.000Z' };
const SESSION_401 = { status: 401, statusText: 'Unauthorized', headers: { 'WWW-Authenticate': 'Bearer realm="ruraliza"' } };

describe('authInterceptor', () => {
  let client: HttpClient;
  let http: HttpTestingController;
  let currentUser: CurrentUserService;
  let systemSession: SystemSessionService;
  let navigate: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    sessionStorage.clear();
    navigate = vi.fn(() => Promise.resolve(true));
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: Router, useValue: { navigateByUrl: navigate } }
      ]
    });
    client = TestBed.inject(HttpClient);
    http = TestBed.inject(HttpTestingController);
    currentUser = TestBed.inject(CurrentUserService);
    systemSession = TestBed.inject(SystemSessionService);
    currentUser.signIn(account, 'account-token');
    systemSession.signIn(admin, 'system-token');
  });

  afterEach(() => http.verify());

  it('sends the account token to app routes and the system token to admin routes', () => {
    client.get(`${environment.apiUrl}/farmers/3`).subscribe();
    client.get(`${environment.apiUrl}/admin/users`).subscribe();
    client.get('https://maps.example.com/x').subscribe();

    expect(http.expectOne(`${environment.apiUrl}/farmers/3`).request.headers.get('Authorization')).toBe('Bearer account-token');
    expect(http.expectOne(`${environment.apiUrl}/admin/users`).request.headers.get('Authorization')).toBe('Bearer system-token');
    expect(http.expectOne('https://maps.example.com/x').request.headers.has('Authorization')).toBe(false);
  });

  it('keeps an Authorization header set by the caller', () => {
    client.get(`${environment.apiUrl}/accounts/1`, { headers: { Authorization: 'Bearer leaving' } }).subscribe();
    expect(http.expectOne(`${environment.apiUrl}/accounts/1`).request.headers.get('Authorization')).toBe('Bearer leaving');
  });

  it('signs out of the account on a session 401 and goes to the sign-in page', () => {
    client.get(`${environment.apiUrl}/farmers/3`).subscribe({ error: () => undefined });
    http.expectOne(`${environment.apiUrl}/farmers/3`).flush({ error: 'Sua sessão expirou.' }, SESSION_401);

    expect(currentUser.user()).toBeNull();
    expect(systemSession.user()).toEqual(admin);
    expect(navigate).toHaveBeenCalledWith('/entrar');
  });

  it('signs out of the system session on a session 401 from admin routes', () => {
    client.get(`${environment.apiUrl}/admin/users`).subscribe({ error: () => undefined });
    http.expectOne(`${environment.apiUrl}/admin/users`).flush({ error: 'Sua sessão expirou.' }, SESSION_401);

    expect(systemSession.user()).toBeNull();
    expect(currentUser.user()).toEqual(account);
    expect(navigate).toHaveBeenCalledWith('/sistema/entrar');
  });

  it('keeps the session on a wrong-password 401 (no WWW-Authenticate)', () => {
    client.patch(`${environment.apiUrl}/farmers/3/password`, {}).subscribe({ error: () => undefined });
    http.expectOne(`${environment.apiUrl}/farmers/3/password`).flush({ error: 'A senha atual está incorreta.' }, { status: 401, statusText: 'Unauthorized' });

    expect(currentUser.user()).toEqual(account);
    expect(navigate).not.toHaveBeenCalled();
  });
});
