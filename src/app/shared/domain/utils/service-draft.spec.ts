import { draftNumber, draftParams, hasDraft } from './service-draft';

describe('service draft', () => {
  it('keeps only filled fields in the query params', () => {
    expect(draftParams({ servico: 'Colheita de café', categoria: 'Colheita', duracao: '' })).toEqual({
      servico: 'Colheita de café',
      categoria: 'Colheita'
    });
  });

  it('detects whether there is a draft', () => {
    expect(hasDraft({})).toBe(false);
    expect(hasDraft({ duracao: '40' })).toBe(true);
  });

  it('parses positive numbers and rejects the rest', () => {
    expect(draftNumber('40')).toBe(40);
    expect(draftNumber('1800.5')).toBe(1800.5);
    expect(draftNumber('0')).toBeNull();
    expect(draftNumber('abc')).toBeNull();
    expect(draftNumber(undefined)).toBeNull();
  });
});
