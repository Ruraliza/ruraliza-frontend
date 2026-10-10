import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { LiveUpdatesService } from './live-updates.service';

// EventSource falso: o jsdom não tem um, e assim o teste dispara os eventos à mão.
class FakeEventSource {
  static last: FakeEventSource | null = null;
  readonly listeners = new Map<string, () => void>();
  closed = false;

  constructor(readonly url: string) {
    FakeEventSource.last = this;
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
    vi.stubGlobal('EventSource', FakeEventSource);
    FakeEventSource.last = null;
    service = TestBed.inject(LiveUpdatesService);
  });

  afterEach(() => vi.unstubAllGlobals());

  it('listens to the service applications stream and closes it on unsubscribe', () => {
    let changes = 0;
    const subscription = service.serviceApplications(7).subscribe(() => changes++);
    const source = FakeEventSource.last!;
    expect(source.url).toBe(`${environment.apiUrl}/farmers/services/7/events`);

    source.emit('applications');
    expect(changes).toBe(1);

    subscription.unsubscribe();
    expect(source.closed).toBe(true);
  });

  it('notifies on reconnection, but not on the first connection', () => {
    let changes = 0;
    service.workerApplications(3).subscribe(() => changes++);
    const source = FakeEventSource.last!;
    expect(source.url).toBe(`${environment.apiUrl}/workers/3/events`);

    source.emit('open');
    expect(changes).toBe(0);
    source.emit('open'); // reconectou: pode ter perdido avisos
    expect(changes).toBe(1);
  });
});
