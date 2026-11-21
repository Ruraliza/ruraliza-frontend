import type { ChatDetail } from '@core/models/chat.model';
import type { Proposal } from '@core/models/service-application.model';
import { PRICE_TO_AGREE, estimateLabel, priceLabel, proposalCards, servicePrice, suggestedTotal } from './agreement';

const proposal = (id: number, status: Proposal['status'] = 'Pending'): Proposal => ({
  id, application_id: 1, service_id: 1, farmer_id: 1, worker_id: 2, amount: 150, unit: 'day', notes: null,
  proposed_by: 'worker', status, insertion_date: '2026-11-20T12:00:00.000Z', answered_at: null
});

describe('agreement', () => {
  it('formats the price per unit', () => {
    expect(priceLabel({ amount: 150, unit: 'day' })).toMatch(/^R\$\s?150,00 por dia$/);
    expect(priceLabel({ amount: 2000, unit: 'fixed' })).toMatch(/pela empreitada$/);
  });

  it('shows the estimate, or "Valor a combinar" on old jobs without a price', () => {
    expect(estimateLabel({ price: 150, price_unit: 'day' })).toMatch(/^Estimativa: R\$\s?150,00 por dia$/);
    expect(estimateLabel({ price: null, price_unit: null })).toBe(PRICE_TO_AGREE);
  });

  it('prefers the agreement over the estimate', () => {
    const terms = { amount: 80, unit: 'hour' as const, notes: null };
    expect(servicePrice({ agreement: terms, price: 150, price_unit: 'day' })).toMatch(/R\$\s?80,00 por hora$/);
    expect(servicePrice({ agreement: null, price: 150, price_unit: 'day' })).toMatch(/^Estimativa/);
  });

  it('suggests the payment total from the accepted proposal: fixed as is, hourly times the hours, the rest typed', () => {
    expect(suggestedTotal({ amount: 900, unit: 'fixed' }, 40)).toBe(900);
    expect(suggestedTotal({ amount: 35.5, unit: 'hour' }, 8)).toBe(284);
    expect(suggestedTotal({ amount: 180, unit: 'day' }, 40)).toBeNull();
    expect(suggestedTotal({ amount: 12, unit: 'meter' }, 8)).toBeNull();
    expect(suggestedTotal(null, 8)).toBeNull();
  });

  it('puts each proposal card on the first message about it', () => {
    const chat = {
      proposals: [proposal(7, 'Accepted')],
      messages: [
        { id: 1, chat_id: 1, sender: 'system', body: 'Conversa aberta', insertion_date: '' },
        { id: 2, chat_id: 1, sender: 'system', body: 'Maria propôs', proposal_id: 7, insertion_date: '' },
        { id: 3, chat_id: 1, sender: 'system', body: 'João aceitou', proposal_id: 7, insertion_date: '' }
      ]
    } as unknown as ChatDetail;

    const cards = proposalCards(chat);
    expect([...cards.keys()]).toEqual([2]);
    expect(cards.get(2)?.status).toBe('Accepted');
  });
});
