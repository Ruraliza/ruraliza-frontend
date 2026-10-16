import { TestBed } from '@angular/core/testing';
import { environment } from '@env/environment';
import { LiveUpdatesService } from './live-updates.service';

// EventSource falso: o jsdom não tem um, e assim o teste dispara os eventos à mão.
class FakeEventSource {
  static all: FakeEventSource[] = [];
  readonly listeners = new Map<string, () => void>();
  closed = false;

  constructor(readonly url: string) {
    FakeEventSource.all.push(this);
  }

  static get last(): FakeEventSource {
    const source = FakeEventSource.all.at(-1);
    if (!source) throw new Error('nenhum EventSource aberto');
    return source;
  }

  addEventListener(type: string, listener: () => void): void {
    this.listeners.set(type, listener);
  }

  emit(type: string): void {
    this.listeners.get(type)?.();
  }

  close(): void {
    this.closed = true;
  }
}

describe('LiveUpdatesService', () => {
  let service: LiveUpdatesService;

  beforeEach(() => {
    // Os arquivos de teste dividem o sessionStorage: um token deixado por outro spec iria para a query.
    sessionStorage.clear();
    vi.stubGlobal('EventSource', FakeEventSource);
    FakeEventSource.all = [];
    service = TestBed.inject(LiveUpdatesService);
  });

  afterEach(() => vi.unstubAllGlobals());

  it('listens to the service applications stream and closes it on unsubscribe', () => {
    let changes = 0;
    const subscription = service.serviceApplications(7).subscribe(() => changes++);
    const source = FakeEventSource.last;
    expect(source.url).toBe(`${environment.apiUrl}/farmers/services/7/events`);

    source.emit('applications');
    expect(changes).toBe(1);

    subscription.unsubscribe();
    expect(source.closed).toBe(true);
  });

  it('notifies on reconnection, but not on the first connection', () => {
    let changes = 0;
    service.workerApplications(3).subscribe(() => changes++);
    const source = FakeEventSource.last;
    expect(source.url).toBe(`${environment.apiUrl}/workers/3/live`);

    source.emit('open');
    expect(changes).toBe(0);
    source.emit('open'); // reconectou: pode ter perdido avisos
    expect(changes).toBe(1);
  });

  it('shares one stream per profile between the chat list, the bell and the applications', () => {
    let chats = 0;
    let bell = 0;
    let applications = 0;
    const subscriptions = [
      service.chats('worker', 3).subscribe(() => chats++),
      service.notifications('worker', 3).subscribe(() => bell++),
      service.workerApplications(3).subscribe(() => applications++)
    ];

    expect(FakeEventSource.all.map((s) => s.url)).toEqual([`${environment.apiUrl}/workers/3/live`]);
    FakeEventSource.last.emit('chats');
    FakeEventSource.last.emit('notifications');
    expect([chats, bell, applications]).toEqual([1, 1, 0]);

    subscriptions.slice(0, 2).forEach((s) => s.unsubscribe());
    expect(FakeEventSource.last.closed).toBe(false); // as candidaturas ainda escutam
    subscriptions[2]?.unsubscribe();
    expect(FakeEventSource.last.closed).toBe(true);
  });

  it('listens to an open chat on its own stream', () => {
    let chat = 0;
    service.chat(5).subscribe(() => chat++);
    const chatSource = FakeEventSource.last;
    expect(chatSource.url).toBe(`${environment.apiUrl}/chats/5/events`);
    chatSource.emit('applications');
    chatSource.emit('chat');
    expect(chat).toBe(1);

    service.chats('farmer', 2).subscribe();
    expect(FakeEventSource.last.url).toBe(`${environment.apiUrl}/farmers/2/live`);
  });

  it('closes the connection when the page goes to the back/forward cache and reopens on the way back', () => {
    let changes = 0;
    service.notifications('farmer', 2).subscribe(() => changes++);
    const first = FakeEventSource.last;
    first.emit('open');

    window.dispatchEvent(new Event('pagehide'));
    expect(first.closed).toBe(true);

    const show = Object.assign(new Event('pageshow'), { persisted: true });
    window.dispatchEvent(show);
    const second = FakeEventSource.last;
    expect(second).not.toBe(first);
    second.emit('open'); // voltou: busca de novo o que pode ter mudado
    expect(changes).toBe(1);
  });
});
