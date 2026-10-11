import { DestroyRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Subject, of } from 'rxjs';
import { Chat } from '../models/chat.model';
import { ChatInboxService } from './chat-inbox.service';
import { ChatService } from './chat.service';
import { LiveUpdatesService } from './live-updates.service';

const chat = (id: number, serviceId: number, unread: number): Chat => ({
  id, service_id: serviceId, service_name: 'Colheita', farmer_id: 1, worker_id: 2,
  farmer: { name: 'João', photo_url: null, phone: null }, worker: { name: 'Maria', photo_url: null, phone: null },
  farmer_shares_phone: false, worker_shares_phone: false, open: true, closes_at: null, unread, last_message: null,
  insertion_date: '2026-10-01T12:00:00.000Z'
});

describe('ChatInboxService', () => {
  let lists: Chat[][];
  let changes: Subject<void>;
  let destroyCallbacks: (() => void)[];
  const destroyRef = { onDestroy: (fn: () => void) => { destroyCallbacks.push(fn); return () => undefined; } } as DestroyRef;

  beforeEach(() => {
    lists = [[chat(1, 10, 2), chat(2, 11, 1)], [chat(1, 10, 0), chat(2, 11, 1), chat(3, 10, 4)]];
    changes = new Subject<void>();
    destroyCallbacks = [];
    TestBed.configureTestingModule({
      providers: [
        { provide: ChatService, useValue: { list: () => of(lists.shift() ?? []) } },
        { provide: LiveUpdatesService, useValue: { chats: () => changes.asObservable() } }
      ]
    });
  });

  it('sums the unread messages and refreshes on every live update', () => {
    const inbox = TestBed.inject(ChatInboxService);
    expect(inbox.loaded()).toBe(false);

    inbox.connect('farmer', 1, destroyRef);
    expect(inbox.unread()).toBe(3);

    changes.next();
    expect(inbox.unread()).toBe(5);
  });

  it('finds the most recent chat of a service (the current worker after a withdrawal)', () => {
    const inbox = TestBed.inject(ChatInboxService);
    inbox.connect('farmer', 1, destroyRef);
    changes.next();

    expect(inbox.forService(10)?.id).toBe(3);
    expect(inbox.forService(99)).toBeNull();
  });

  it('forgets the chats when the area closes', () => {
    const inbox = TestBed.inject(ChatInboxService);
    inbox.connect('worker', 2, destroyRef);
    destroyCallbacks.forEach((fn) => fn());

    expect(inbox.chats()).toEqual([]);
    expect(inbox.unread()).toBe(0);
  });
});
