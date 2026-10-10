import { TestBed } from '@angular/core/testing';
import { ConnectivityService } from './connectivity.service';

describe('ConnectivityService', () => {
  it('follows the browser online/offline events', () => {
    const connectivity = TestBed.inject(ConnectivityService);
    expect(connectivity.online()).toBe(true);

    window.dispatchEvent(new Event('offline'));
    expect(connectivity.online()).toBe(false);
    window.dispatchEvent(new Event('online'));
    expect(connectivity.online()).toBe(true);
  });
});
