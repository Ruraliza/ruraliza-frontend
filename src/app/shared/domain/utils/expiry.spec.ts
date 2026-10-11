import { daysLeft, expiryLabel, formatDay, isExpired, todayBr } from './expiry';

// 30/09/2026 às 23h30 em Brasília = 01/10/2026 02:30 UTC.
const LATE_NIGHT_BR = new Date('2026-10-01T02:30:00.000Z');

describe('expiry', () => {
  it('uses the Brazil calendar day, not the UTC one', () => {
    expect(todayBr(LATE_NIGHT_BR)).toBe('2026-09-30');
  });

  it('keeps the job open until the end of the last day', () => {
    expect(isExpired({ status: 'Pending', expires_at: '2026-09-30' }, LATE_NIGHT_BR)).toBe(false);
    expect(isExpired({ status: 'Pending', expires_at: '2026-09-29' }, LATE_NIGHT_BR)).toBe(true);
  });

  it('only open jobs with a deadline can expire', () => {
    expect(isExpired({ status: 'Pending', expires_at: null }, LATE_NIGHT_BR)).toBe(false);
    expect(isExpired({ status: 'In Progress', expires_at: '2026-01-01' }, LATE_NIGHT_BR)).toBe(false);
  });

  it('counts the days left', () => {
    expect(daysLeft('2026-09-30', LATE_NIGHT_BR)).toBe(0);
    expect(daysLeft('2026-10-05', LATE_NIGHT_BR)).toBe(5);
    expect(daysLeft(null, LATE_NIGHT_BR)).toBeNull();
  });

  it('describes the deadline in plain words', () => {
    expect(expiryLabel({ status: 'Pending', expires_at: '2026-09-30' }, LATE_NIGHT_BR)).toBe('Último dia para se candidatar');
    expect(expiryLabel({ status: 'Pending', expires_at: '2026-10-01' }, LATE_NIGHT_BR)).toBe('Candidaturas até amanhã');
    expect(expiryLabel({ status: 'Pending', expires_at: '2026-10-31' }, LATE_NIGHT_BR)).toBe('Candidaturas até 31/10/2026');
    expect(expiryLabel({ status: 'Pending', expires_at: '2026-09-01' }, LATE_NIGHT_BR)).toBe('Prazo encerrado');
    expect(expiryLabel({ status: 'Pending', expires_at: null }, LATE_NIGHT_BR)).toBeNull();
  });

  it('formats a calendar day without shifting it by the time zone', () => {
    expect(formatDay('2026-01-01')).toBe('01/01/2026');
  });
});
