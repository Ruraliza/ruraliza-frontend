import { formatDuration, formatLongDate, formatWorkload, isMobilePhone } from './format';

describe('formatação de duração e datas longas', () => {
  it('mostra a carga horária curta', () => {
    expect(formatDuration(45)).toBe('45 min');
    expect(formatDuration(60)).toBe('1 h');
    expect(formatDuration(105)).toBe('1 h 45 min');
    expect(formatDuration(0)).toBe('0 min');
  });

  it('mostra a carga horária por extenso', () => {
    expect(formatWorkload(60)).toBe('1 hora');
    expect(formatWorkload(121)).toBe('2 horas e 1 minuto');
    expect(formatWorkload(30)).toBe('30 minutos');
  });

  it('usa o dia de Brasília na data por extenso', () => {
    expect(formatLongDate('2026-10-11T02:00:00.000Z')).toBe('10 de outubro de 2026');
  });
});

describe('isMobilePhone', () => {
  it('accepts a Brazilian mobile number with area code and refuses landlines', () => {
    expect(isMobilePhone('24999998888')).toBe(true);
    expect(isMobilePhone('(24) 99999-8888')).toBe(true);
    expect(isMobilePhone('2433334444')).toBe(false);
    expect(isMobilePhone('999998888')).toBe(false);
  });
});
