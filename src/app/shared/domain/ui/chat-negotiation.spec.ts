import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { ChatService } from '@core/api/chat.service';
import { ChatDetail } from '@core/models/chat.model';
import { Proposal, ProposalInput } from '@core/models/service-application.model';
import { ChatNegotiation } from './chat-negotiation';

const proposal: Proposal = {
  id: 5, application_id: 1, service_id: 1, farmer_id: 1, worker_id: 2, amount: 170, unit: 'hour', notes: null,
  proposed_by: 'worker', status: 'Pending', insertion_date: '2026-11-20T12:00:00.000Z', answered_at: null
};

function chat(changes: Partial<ChatDetail> = {}): ChatDetail {
  return {
    id: 3, service_id: 1, service_name: 'Colheita', farmer_id: 1, worker_id: 2,
    farmer: { name: 'João', photo_url: null, phone: null }, worker: { name: 'Maria', photo_url: null, phone: null },
    farmer_shares_phone: false, worker_shares_phone: false, hired: false, open: true, closes_at: null, unread: 0, last_message: null,
    insertion_date: '2026-11-20T12:00:00.000Z', messages: [], application_id: 1, proposals: [],
    estimate: { price: 150, price_unit: 'day' }, ...changes
  };
}

describe('ChatNegotiation', () => {
  let sent: ProposalInput[];

  beforeAll(() => {
    // O jsdom não abre <dialog> modal.
    HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) { this.setAttribute('open', ''); };
    HTMLDialogElement.prototype.close ??= function (this: HTMLDialogElement) { this.removeAttribute('open'); };
  });

  function render(detail: ChatDetail): ChatNegotiation {
    sent = [];
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: ChatService, useValue: { propose: (_id: number, input: ProposalInput) => { sent.push(input); return of({ message: 'ok', proposal }); } } }
      ]
    });
    const fixture = TestBed.createComponent(ChatNegotiation);
    fixture.componentRef.setInput('chat', detail);
    fixture.componentRef.setInput('role', 'farmer');
    fixture.detectChanges();
    return fixture.componentInstance;
  }

  it('starts the first proposal from the job estimate, and anyone can change it', () => {
    const negotiation = render(chat());

    negotiation.open();
    expect(negotiation.form.getRawValue()).toEqual({ amount: 150, unit: 'day', notes: '' });

    negotiation.form.patchValue({ amount: 160 });
    negotiation.submit();
    expect(sent).toEqual([{ amount: 160, unit: 'day', notes: null }]);
  });

  it('does not prefill after the first proposal', () => {
    const negotiation = render(chat({ proposals: [proposal] }));

    negotiation.open();
    expect(negotiation.form.getRawValue().amount).toBeNull();
  });

  it('does not prefill on old jobs without an estimate', () => {
    const negotiation = render(chat({ estimate: null }));

    negotiation.open();
    expect(negotiation.form.getRawValue().amount).toBeNull();
  });

  it('a counter-proposal starts from the proposal received', () => {
    const negotiation = render(chat({ proposals: [proposal] }));

    negotiation.open(proposal);
    expect(negotiation.form.getRawValue()).toEqual({ amount: 170, unit: 'hour', notes: '' });
  });
});
