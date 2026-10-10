import { TestBed } from '@angular/core/testing';
import { SwUpdate, VersionEvent } from '@angular/service-worker';
import { Subject } from 'rxjs';
import { AppUpdateService } from './app-update.service';

describe('AppUpdateService', () => {
  it('flags a new version once the service worker has downloaded it', () => {
    const versionUpdates = new Subject<VersionEvent>();
    TestBed.configureTestingModule({
      providers: [{ provide: SwUpdate, useValue: { isEnabled: true, versionUpdates, unrecoverable: new Subject(), checkForUpdate: vi.fn() } }]
    });
    const updates = TestBed.inject(AppUpdateService);

    versionUpdates.next({ type: 'VERSION_DETECTED', version: { hash: 'b' } });
    expect(updates.updateReady()).toBe(false);
    versionUpdates.next({ type: 'VERSION_READY', currentVersion: { hash: 'a' }, latestVersion: { hash: 'b' } });
    expect(updates.updateReady()).toBe(true);
  });

  it('does nothing without the service worker', () => {
    expect(TestBed.inject(AppUpdateService).updateReady()).toBe(false);
  });
});
