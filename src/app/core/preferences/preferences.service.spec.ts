import { TestBed } from '@angular/core/testing';
import { Observable, of } from 'rxjs';
import { AccountPreferences, AccountPreferencesInput, SessionUser } from '../models/auth.model';
import { AccountService } from '../api/account.service';
import { CurrentUserService } from '../session/current-user.service';
import { DEFAULT_PREFERENCES, PREFERENCES_STORAGE_KEY, PreferencesService } from './preferences.service';

const session: SessionUser = { account_id: 7, role: 'farmer', id: 1, profiles: { farmer: 1, worker: null } };

describe('PreferencesService', () => {
  let saved: AccountPreferencesInput[];
  let fromAccount: AccountPreferences;
  const root = document.documentElement;

  function setup(): PreferencesService {
    TestBed.configureTestingModule({
      providers: [{
        provide: AccountService,
        useValue: {
          getPreferences: (): Observable<AccountPreferences> => of(fromAccount),
          updatePreferences: (_id: number, changes: AccountPreferencesInput) => {
            saved.push(changes);
            return of({ message: 'ok', preferences: { ...fromAccount, ...changes } });
          }
        }
      }]
    });
    const service = TestBed.inject(PreferencesService);
    TestBed.tick();
    return service;
  }

  beforeEach(() => {
    saved = [];
    fromAccount = DEFAULT_PREFERENCES;
    localStorage.clear();
    sessionStorage.clear();
    for (const key of ['theme', 'text', 'contrast']) delete root.dataset[key];
  });

  it('starts light and applies what this device saved before', () => {
    localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify({ theme: 'dark', text_size: 'large', high_contrast: true }));

    setup();

    expect([root.dataset['theme'], root.dataset['text'], root.dataset['contrast']]).toEqual(['dark', 'large', 'high']);
  });

  it('applies a change at once, keeps it on the device and, signed in, saves it in the account', () => {
    const service = setup();
    service.update({ theme: 'dark' });
    TestBed.tick();
    expect(root.dataset['theme']).toBe('dark');
    expect(saved).toEqual([]); // sem conta aberta, fica só no aparelho

    TestBed.inject(CurrentUserService).signIn(session, 'token');
    TestBed.tick();
    service.update({ high_contrast: true });
    TestBed.tick();

    expect(saved).toEqual([{ high_contrast: true }]);
    expect(JSON.parse(localStorage.getItem(PREFERENCES_STORAGE_KEY) ?? '{}')).toEqual({ theme: 'light', text_size: 'normal', high_contrast: true, whatsapp_alerts: false });
  });

  it('uses the preferences saved in the account after signing in', () => {
    fromAccount = { theme: 'dark', text_size: 'large', high_contrast: false, whatsapp_alerts: false };
    const service = setup();

    TestBed.inject(CurrentUserService).signIn(session, 'token');
    TestBed.tick();

    expect(service.preferences()).toEqual(fromAccount);
    expect([root.dataset['theme'], root.dataset['text'], root.dataset['contrast']]).toEqual(['dark', 'large', undefined]);
  });

  it('turns larger text and high contrast on and off together from the menu shortcut', () => {
    const service = setup();

    service.toggleEasyReading();
    TestBed.tick();
    expect(service.easyReading()).toBe(true);
    expect([root.dataset['text'], root.dataset['contrast']]).toEqual(['large', 'high']);

    service.toggleEasyReading();
    TestBed.tick();
    expect([root.dataset['text'], root.dataset['contrast']]).toEqual([undefined, undefined]);
  });

  it('reads what older versions saved (without the WhatsApp choice) as WhatsApp off', () => {
    localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify({ theme: 'dark', text_size: 'normal', high_contrast: false }));

    expect(setup().preferences()).toEqual({ theme: 'dark', text_size: 'normal', high_contrast: false, whatsapp_alerts: false });
  });

  it('ignores a broken saved value', () => {
    localStorage.setItem(PREFERENCES_STORAGE_KEY, '{"theme":"azul"}');

    expect(setup().preferences()).toEqual(DEFAULT_PREFERENCES);
  });
});
