import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { errorInterceptor } from '../http/error.interceptor';
import { CurrentUserService } from '../session/current-user.service';
import { ToastService } from '../toast/toast.service';
import { OfflineQueueService } from './offline-queue.service';

describe('OfflineQueueService', () => {
  let queue: OfflineQueueService;
  let http: HttpTestingController;
  let toast: ToastService;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    TestBed.configureTestingModule({ providers: [provideHttpClient(withInterceptors([errorInterceptor])), provideHttpClientTesting()] });
    TestBed.inject(CurrentUserService).signIn({ account_id: 4, role: 'worker', id: 7, profiles: { farmer: null, worker: 7 } }, 'token');
    queue = TestBed.inject(OfflineQueueService);
    http = TestBed.inject(HttpTestingController);
    toast = TestBed.inject(ToastService);
    TestBed.tick();
    http.match(() => true); // o flush inicial não tem nada a enviar
  });

  afterEach(() => localStorage.clear());

  it('keeps what was done offline, once per action, saved on the device', () => {
    queue.enqueue({ method: 'PUT', url: 'http://api/aula/1', label: 'a aula 1' });
    queue.enqueue({ method: 'PUT', url: 'http://api/aula/1', label: 'a aula 1' });
    queue.enqueue({ method: 'PUT', url: 'http://api/aula/2', label: 'a aula 2' });

    expect(queue.pending()).toBe(2);
    expect(JSON.parse(localStorage.getItem('ruraliza.offlineQueue') ?? '[]').length).toBe(2);
  });

  it('sends in order when the signal comes back and stops at the first network failure', async () => {
    queue.enqueue({ method: 'PUT', url: 'http://api/aula/1', label: 'a aula 1' });
    queue.enqueue({ method: 'PUT', url: 'http://api/aula/2', label: 'a aula 2' });

    const flushing = queue.flush();
    http.expectOne('http://api/aula/1').flush({});
    await Promise.resolve();
    await new Promise((r) => setTimeout(r));
    http.expectOne('http://api/aula/2').error(new ProgressEvent('error'), { status: 0 });
    await flushing;

    expect(queue.pending()).toBe(1);
  });

  it('drops an action the API no longer accepts and says why', async () => {
    const errors: string[] = [];
    const original = toast.error.bind(toast);
    toast.error = (message: string) => { errors.push(message); original(message); };
    queue.enqueue({ method: 'PUT', url: 'http://api/aula/1', label: 'a aula 1' });

    const flushing = queue.flush();
    http.expectOne('http://api/aula/1').flush({ error: 'Trilha não encontrada.' }, { status: 404, statusText: 'Not Found' });
    await flushing;

    expect(queue.pending()).toBe(0);
    expect(errors).toEqual(['Não foi possível enviar a aula 1: Trilha não encontrada.']);
  });
});
