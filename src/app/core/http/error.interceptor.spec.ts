import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ToastService } from '../toast/toast.service';
import { ApiError, SERVER_UNREACHABLE_MESSAGE } from './api-error';
import { errorInterceptor } from './error.interceptor';

describe('errorInterceptor', () => {
  let client: HttpClient;
  let http: HttpTestingController;
  let toast: ToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withInterceptors([errorInterceptor])), provideHttpClientTesting()]
    });
    client = TestBed.inject(HttpClient);
    http = TestBed.inject(HttpTestingController);
    toast = TestBed.inject(ToastService);
  });

  afterEach(() => http.verify());

  function capture(): { error: ApiError | null } {
    const result: { error: ApiError | null } = { error: null };
    client.get('/api/x').subscribe({ error: (e: ApiError) => (result.error = e) });
    return result;
  }

  it('passes the API { error } message through and rethrows it', () => {
    const result = capture();
    http.expectOne('/api/x').flush({ error: 'Já existe um cadastro com este CPF.' }, { status: 409, statusText: 'Conflict' });

    expect(result.error).toBeInstanceOf(ApiError);
    expect(result.error?.status).toBe(409);
    expect(result.error?.message).toBe('Já existe um cadastro com este CPF.');
  });

  it('explains how to fix it when the API is unreachable (status 0)', () => {
    const result = capture();
    http.expectOne('/api/x').error(new ProgressEvent('error'));

    expect(result.error?.status).toBe(0);
    expect(result.error?.message).toBe(SERVER_UNREACHABLE_MESSAGE);
  });

  it('uses a generic message for 5xx without body', () => {
    const result = capture();
    http.expectOne('/api/x').flush(null, { status: 500, statusText: 'Server Error' });

    expect(result.error?.message).toContain('servidor');
  });

  it('sends the message to the toast service', () => {
    capture();
    http.expectOne('/api/x').flush({ error: 'Serviço não encontrado.' }, { status: 404, statusText: 'Not Found' });

    const toasts = toast.toasts();
    expect(toasts.length).toBe(1);
    expect(toasts[0].kind).toBe('error');
    expect(toasts[0].message).toBe('Serviço não encontrado.');
  });
});
