import { TestBed } from '@angular/core/testing';
import { CURRENT_USER_STORAGE_KEY, CurrentUserService } from './current-user.service';

describe('CurrentUserService', () => {
  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({});
  });

  it('starts empty when nothing is stored', () => {
    const service = TestBed.inject(CurrentUserService);
    expect(service.user()).toBeNull();
    expect(service.role()).toBeNull();
  });

  it('stores the selected profile in sessionStorage', () => {
    const service = TestBed.inject(CurrentUserService);
    service.set({ role: 'farmer', id: 3 });

    expect(service.role()).toBe('farmer');
    expect(JSON.parse(sessionStorage.getItem(CURRENT_USER_STORAGE_KEY) as string)).toEqual({ role: 'farmer', id: 3 });
  });

  it('restores the profile from sessionStorage', () => {
    sessionStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify({ role: 'worker', id: 8 }));
    const service = TestBed.inject(CurrentUserService);

    expect(service.user()).toEqual({ role: 'worker', id: 8 });
    expect(service.requireId('worker')).toBe(8);
  });

  it('discards an invalid stored value and warns', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    sessionStorage.setItem(CURRENT_USER_STORAGE_KEY, '{"role":"admin"}');

    const service = TestBed.inject(CurrentUserService);

    expect(service.user()).toBeNull();
    expect(sessionStorage.getItem(CURRENT_USER_STORAGE_KEY)).toBeNull();
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('clears the profile', () => {
    const service = TestBed.inject(CurrentUserService);
    service.set({ role: 'worker', id: 1 });
    service.clear();

    expect(service.user()).toBeNull();
    expect(sessionStorage.getItem(CURRENT_USER_STORAGE_KEY)).toBeNull();
  });

  it('fails fast when the expected role is not selected', () => {
    const service = TestBed.inject(CurrentUserService);
    service.set({ role: 'worker', id: 1 });

    expect(() => service.requireId('farmer')).toThrowError(/farmer/);
  });
});
