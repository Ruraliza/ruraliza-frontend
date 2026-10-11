import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { SwPush } from '@angular/service-worker';
import { BehaviorSubject } from 'rxjs';
import { environment } from '@env/environment';
import { SessionUser } from '../models/auth.model';
import { CurrentUserService } from '../session/current-user.service';
import { PushService } from './push.service';

const user: SessionUser = { account_id: 7, role: 'farmer', id: 2, profiles: { farmer: 2, worker: null } };
const accountUrl = `${environment.apiUrl}/accounts/7/push-subscriptions`;

function fakeSubscription(endpoint: string): PushSubscription {
  return { endpoint, toJSON: () => ({ endpoint, keys: { p256dh: 'chave', auth: 'segredo' } }) } as unknown as PushSubscription;
}

// SwPush falso: o jsdom não tem service worker; a inscrição muda à mão.
class FakeSwPush {
  readonly isEnabled = true;
  readonly subscription = new BehaviorSubject<PushSubscription | null>(null);
  requestSubscription = vi.fn(async () => {
    const sub = fakeSubscription('https://push.exemplo.com/novo');
    this.subscription.next(sub);
    return sub;
  });
  unsubscribe = vi.fn(async () => this.subscription.next(null));
}

describe('PushService', () => {
  let swPush: FakeSwPush;
  let http: HttpTestingController;

  function setup(withSwPush = true): PushService {
    swPush = new FakeSwPush();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), ...(withSwPush ? [{ provide: SwPush, useValue: swPush }] : [])]
    });
    http = TestBed.inject(HttpTestingController);
    return TestBed.inject(PushService);
  }

  beforeEach(() => {
    sessionStorage.clear();
    vi.stubGlobal('Notification', { permission: 'default' });
  });

  afterEach(() => {
    http.verify();
    vi.unstubAllGlobals();
  });

  it('is unsupported without the service worker', () => {
    expect(setup(false).state()).toBe('unsupported');
  });

  it('enables: fetches the VAPID key, subscribes in the browser and saves it on the account', async () => {
    const push = setup();
    TestBed.inject(CurrentUserService).set(user);
    expect(push.state()).toBe('off');

    const enabling = push.enable();
    http.expectOne(`${environment.apiUrl}/config/push`).flush({ public_key: 'chave-publica' });
    await vi.waitFor(() => expect(swPush.requestSubscription).toHaveBeenCalledWith({ serverPublicKey: 'chave-publica' }));
    TestBed.tick();
    const save = await vi.waitFor(() => http.expectOne({ method: 'POST', url: accountUrl }));
    expect(save.request.body).toEqual({ endpoint: 'https://push.exemplo.com/novo', keys: { p256dh: 'chave', auth: 'segredo' } });
    save.flush({ message: 'ok' });
    await enabling;

    expect(push.state()).toBe('on');
  });

  it('re-sends an existing subscription once the account is open (the API keeps it in memory)', () => {
    setup();
    swPush.subscription.next(fakeSubscription('https://push.exemplo.com/antigo'));
    TestBed.tick();
    http.expectNone(accountUrl); // ninguém entrou ainda

    TestBed.inject(CurrentUserService).set(user);
    TestBed.tick();
    http.expectOne({ method: 'POST', url: accountUrl }).flush({ message: 'ok' });

    TestBed.inject(CurrentUserService).set({ ...user, role: 'worker', id: 5, profiles: { farmer: 2, worker: 5 } });
    TestBed.tick();
    http.expectNone(accountUrl); // mesma conta, mesma inscrição
  });

  it('disables: unsubscribes in the browser and removes it from the account', async () => {
    const push = setup();
    TestBed.inject(CurrentUserService).set(user);
    swPush.subscription.next(fakeSubscription('https://push.exemplo.com/antigo'));
    TestBed.tick();
    http.expectOne({ method: 'POST', url: accountUrl }).flush({ message: 'ok' });

    const disabling = push.disable();
    const remove = await vi.waitFor(() => http.expectOne({ method: 'DELETE', url: accountUrl }));
    expect(remove.request.body).toEqual({ endpoint: 'https://push.exemplo.com/antigo' });
    remove.flush({ message: 'ok' });
    await disabling;

    expect(swPush.unsubscribe).toHaveBeenCalled();
    expect(push.state()).toBe('off');
  });
});
