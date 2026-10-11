import { TestBed } from '@angular/core/testing';
import { SystemUser } from '../../../models/system.model';
import { SYSTEM_SESSION_STORAGE_KEY, SystemSessionService } from './system-session.service';

const tutor: SystemUser = { id: 2, email: 'tutor@exemplo.com', name: 'Tiago', role: 'tutor', insertion_date: '2026-01-01T00:00:00.000Z' };

describe('SystemSessionService', () => {
  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({});
  });

  it('stores and restores the system session', () => {
    TestBed.inject(SystemSessionService).signIn(tutor, 'tok');
    TestBed.resetTestingModule();
    const restored = TestBed.inject(SystemSessionService);

    expect(restored.user()).toEqual(tutor);
    expect(restored.token()).toBe('tok');
  });

  it('allows only what the role can do', () => {
    const session = TestBed.inject(SystemSessionService);
    expect(session.can('users:manage')).toBe(false);

    session.signIn(tutor, 'tok');
    expect(session.can('tracks:manage')).toBe(true);
    expect(session.can('users:manage')).toBe(false);

    session.update({ ...tutor, role: 'admin' });
    expect(session.can('users:manage')).toBe(true);
    expect(session.can('system-users:manage')).toBe(true);
    expect(session.token()).toBe('tok');
  });

  it('discards an invalid stored value and clears', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    sessionStorage.setItem(SYSTEM_SESSION_STORAGE_KEY, JSON.stringify({ user: { ...tutor, role: 'gerente' }, token: 'tok' }));
    const session = TestBed.inject(SystemSessionService);
    expect(session.user()).toBeNull();
    expect(warn).toHaveBeenCalledTimes(1);
    warn.mockRestore();

    session.signIn(tutor, 'tok');
    session.clear();
    expect(sessionStorage.getItem(SYSTEM_SESSION_STORAGE_KEY)).toBeNull();
  });
});
