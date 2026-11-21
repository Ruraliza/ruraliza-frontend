import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { LiveUpdatesService } from '@core/api/live-updates.service';
import { InviteWithService } from '@core/models/service-application.model';
import { WorkerService } from '../data-access/worker.service';
import { InviteInboxService } from '../data-access/invite-inbox.service';
import { InvitesPage } from './invites-page';

const SERVICE = {
  id: 3, farmer_id: 1, farm_id: 1, worker_id: null, payment_id: null, proposal_id: null, agreement: null, completed_at: null,
  name: 'Conserto de cerca', description: null, category: 'Conserto de cerca', duration: 8, price: 12, price_unit: 'meter' as const,
  expires_at: null, status: 'Pending' as const, insertion_date: '2026-11-20T12:00:00.000Z', farm: { city: 'Três Rios', state: 'RJ', photos: [] }, payment: null
};
const invite = (id: number, status: InviteWithService['status']): InviteWithService => ({
  id, service_id: 3, farmer_id: 1, worker_id: 4, status, insertion_date: '2026-11-20T12:00:00.000Z', answered_at: null, service: SERVICE
});

describe('InvitesPage', () => {
  it('counts the pending invites, and accepting opens the chat', () => {
    const answers: [number, string][] = [];
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: LiveUpdatesService, useValue: { notifications: () => of() } },
        {
          provide: WorkerService,
          useValue: {
            getInvites: () => of([invite(1, 'Pending'), invite(2, 'Expired')]),
            answerInvite: (id: number, action: string) => {
              answers.push([id, action]);
              const { service: _service, ...accepted } = invite(1, 'Accepted');
              return of({ message: 'ok', invite: accepted, chat_id: 9 });
            }
          }
        }
      ]
    });
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const inbox = TestBed.inject(InviteInboxService);
    inbox.connect(4, { onDestroy: () => () => undefined } as never);
    const fixture = TestBed.createComponent(InvitesPage);
    fixture.detectChanges();
    expect(inbox.pending()).toBe(1);
    const host = fixture.nativeElement as HTMLElement;
    expect(host.textContent).toContain('Expirou: a vaga fechou');

    [...host.querySelectorAll('button')].find((b) => b.textContent?.includes('Aceitar'))?.click();

    expect(answers).toEqual([[1, 'Accept']]);
    expect(navigate).toHaveBeenCalledWith(['/trabalhador/conversas', 9]);
    expect(inbox.pending()).toBe(0);
  });
});
