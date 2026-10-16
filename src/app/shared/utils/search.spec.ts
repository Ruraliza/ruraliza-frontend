import { matchesAllWords, searchable } from './search';

describe('busca sem acento', () => {
  it('ignora acentos e maiúsculas', () => {
    expect(searchable('Ação na Colheita')).toBe('acao na colheita');
  });

  it('acha quando todas as palavras aparecem, em qualquer ordem', () => {
    expect(matchesAllWords('Como funciona o pagamento?', 'pagamento como')).toBe(true);
    expect(matchesAllWords('Como funciona o pagamento?', 'pagamento pix')).toBe(false);
    expect(matchesAllWords('Qualquer texto', '   ')).toBe(true);
  });
});
