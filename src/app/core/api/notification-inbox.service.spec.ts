import { DestroyRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Subject, of } from 'rxjs';
import { AppNotification, NotificationsPage } from '../models/notification.model';
import { LiveUpdatesService } from './live-updates.service';
import { NotificationInboxService } from './notification-inbox.service';
import { NotificationService } from './notification.service';

const alert = (id: number, read: boolean, count = 1): AppNotification => ({
  id, title: 'Nova candidatura', body: 'Maria se candidatou.', url: 'produtor/servicos/1', count, read, insertion_date: '2026-10-01T12:00:00.000Z'
});

describe('NotificationInboxService', () => {
  let pages: NotificationsPage[];
  let marked: (number[] | undefined)[];
  let changes: Subject<void>;
  let destroyCallbacks: (() => void)[];
  const destroyRef = { onDestroy: (fn: () => void) => { destroyCallbacks.push(fn); return () => undefined; } } as DestroyRef;

  beforeEach(() => {
    pages = [
      { unread: 3, items: [alert(2, false, 2), alert(1, false)] },
      { unread: 4, items: [alert(3, false), alert(2, false, 2), alert(1, false)] }
    ];
    marked = [];
    changes = new Subject<void>();
    destroyCallbacks = [];
    TestBed.configureTestingModule({
      providers: [
        {
          provide: NotificationService,
          useValue: {
            list: () => of(pages.shift() ?? { unread: 0, items: [] }),
            markRead: (_role: string, _id: number, ids?: number[]) => { marked.push(ids); return of({ message: 'ok', unread: ids ? 2 : 0 }); }
          }
        },
        { provide: LiveUpdatesService, useValue: { notifications: () => changes.asObservable() } }
      ]
    });
  });

  it('counts the unread alerts for the bell and refreshes on every live update', () => {
    const inbox = TestBed.inject(NotificationInboxService);
    expect(inbox.loaded()).toBe(false);

    inbox.connect('farmer', 1, destroyRef);
    expect(inbox.unread()).toBe(3);

    changes.next();
    expect(inbox.unread()).toBe(4);
    expect(inbox.items().map((n) => n.id)).toEqual([3, 2, 1]);
  });

  it('marks one alert read at once, counting its grouped alerts', () => {
    const inbox = TestBed.inject(NotificationInboxService);
    inbox.connect('worker', 2, destroyRef);

    inbox.markRead([2]);

    expect(marked).toEqual([[2]]);
    expect(inbox.unread()).toBe(2);
    expect(inbox.items().find((n) => n.id === 2)?.read).toBe(true);
  });

  it('marks everything read and forgets the alerts when the area closes', () => {
    const inbox = TestBed.inject(NotificationInboxService);
    inbox.connect('worker', 2, destroyRef);

    inbox.markRead();
    expect(marked).toEqual([undefined]);
    expect(inbox.unread()).toBe(0);

    destroyCallbacks.forEach((fn) => fn());
    expect(inbox.items()).toEqual([]);
  });
});
