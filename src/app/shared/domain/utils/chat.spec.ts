import { chatTime, dayLabel, hasContact, whatsappLink } from './chat';

describe('chat utils', () => {
  it('detects phone numbers and e-mails the API will hide', () => {
    expect(hasContact('me chama no (24) 98888-7766')).toBe(true);
    expect(hasContact('24988887766')).toBe(true);
    expect(hasContact('manda para maria@exemplo.com')).toBe(true);
  });

  it('ignores prices, dates and quantities', () => {
    expect(hasContact('Pago R$ 1.500,00 no fim')).toBe(false);
    expect(hasContact('Começa dia 12/10 às 7h')).toBe(false);
    expect(hasContact('São 40 sacos de 60 kg')).toBe(false);
  });

  it('builds a wa.me link with the Brazil country code', () => {
    expect(whatsappLink('24988887766')).toBe('https://wa.me/5524988887766');
    expect(whatsappLink('5524988887766')).toBe('https://wa.me/5524988887766');
  });

  it('shows the time today, "Ontem" yesterday and the date before that (Brasília time)', () => {
    const now = new Date('2026-10-11T18:00:00.000Z'); // 15h em Brasília
    expect(chatTime('2026-10-11T13:05:00.000Z', now)).toBe('10:05');
    expect(chatTime('2026-10-10T13:05:00.000Z', now)).toBe('Ontem');
    expect(chatTime('2026-10-01T13:05:00.000Z', now)).toBe('01/10');
    expect(dayLabel('2026-10-11T02:00:00.000Z', now)).toBe('Ontem'); // 23h do dia 10 em Brasília
  });
});
