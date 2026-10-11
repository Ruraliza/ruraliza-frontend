import { TestBed } from '@angular/core/testing';
import { SessionUser } from '../../../models/auth.model';
import { CURRENT_TOKEN_STORAGE_KEY, CURRENT_USER_STORAGE_KEY, CurrentUserService } from './current-user.service';

const farmer: SessionUser = { account_id: 1, role: 'farmer', id: 3, profiles: { farmer: 3, worker: null } };
const both: SessionUser = { account_id: 4, role: 'worker', id: 8, profiles: { farmer: 5, worker: 8 } };

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

  it('stores the account session in sessionStorage', () => {
    const service = TestBed.inject(CurrentUserService);
    service.set(farmer);

    expect(service.role()).toBe('farmer');
    expect(JSON.parse(sessionStorage.getItem(CURRENT_USER_STORAGE_KEY) as string)).toEqual(farmer);
  });

  it('signs in with the session token and keeps it when the session changes', () => {
    const service = TestBed.inject(CurrentUserService);
    service.signIn(farmer, 'tok-1');
    service.set({ ...farmer, profiles: { farmer: 3, worker: 9 } });

    expect(service.token()).toBe('tok-1');
    expect(sessionStorage.getItem(CURRENT_TOKEN_STORAGE_KEY)).toBe('tok-1');
  });

  it('restores the session from sessionStorage', () => {
    sessionStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(both));
    sessionStorage.setItem(CURRENT_TOKEN_STORAGE_KEY, 'tok-2');
    const service = TestBed.inject(CurrentUserService);

    expect(service.user()).toEqual(both);
    expect(service.token()).toBe('tok-2');
    expect(service.requireId('worker')).toBe(8);
  });

  it('discards a stored session without token (from before the API had tokens)', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    sessionStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(both));
    const service = TestBed.inject(CurrentUserService);

    expect(service.user()).toBeNull();
    expect(sessionStorage.getItem(CURRENT_USER_STORAGE_KEY)).toBeNull();
    expect(warn).toHaveBeenCalledTimes(1);
    warn.mockRestore();
  });

  it('discards an invalid or old-format stored value and warns', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    // Formato antigo (sem conta) e perfil ativo que não bate com os perfis da conta.
    for (const stored of ['{"role":"worker","id":8}', JSON.stringify({ ...both, id: 99 })]) {
      sessionStorage.setItem(CURRENT_USER_STORAGE_KEY, stored);
      sessionStorage.setItem(CURRENT_TOKEN_STORAGE_KEY, 'tok');
      TestBed.resetTestingModule();
      const service = TestBed.inject(CurrentUserService);

      expect(service.user()).toBeNull();
      expect(sessionStorage.getItem(CURRENT_USER_STORAGE_KEY)).toBeNull();
    }
    expect(warn).toHaveBeenCalledTimes(2);
    warn.mockRestore();
  });

  it('clears the session', () => {
    const service = TestBed.inject(CurrentUserService);
    service.signIn(farmer, 'tok');
    service.clear();

    expect(service.user()).toBeNull();
    expect(service.token()).toBeNull();
    expect(sessionStorage.getItem(CURRENT_USER_STORAGE_KEY)).toBeNull();
    expect(sessionStorage.getItem(CURRENT_TOKEN_STORAGE_KEY)).toBeNull();
  });

  it('fails fast when the expected role is not the open panel', () => {
    const service = TestBed.inject(CurrentUserService);
    service.set(farmer);

    expect(() => service.requireId('worker')).toThrowError(/worker/);
  });

  it('knows which profiles the account has and opens the other panel only if it exists', () => {
    const service = TestBed.inject(CurrentUserService);
    service.set(farmer);
    expect(service.hasProfile('farmer')).toBe(true);
    expect(service.hasProfile('worker')).toBe(false);
    expect(() => service.activate('worker')).toThrowError(/worker/);

    service.set(both);
    service.activate('farmer');
    expect(service.user()).toEqual({ ...both, role: 'farmer', id: 5 });
  });
});
