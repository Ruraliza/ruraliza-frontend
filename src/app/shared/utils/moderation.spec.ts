import { FormControl } from '@angular/forms';
import { hasBlockedTerm, noBlockedTerms } from './moderation';

describe('filtro de palavrões', () => {
  it('acha palavrão com acento, maiúscula, letra repetida ou número no lugar da letra', () => {
    expect(hasBlockedTerm('Que PORRA é essa')).toBe(true);
    expect(hasBlockedTerm('p0rr4 nenhuma')).toBe(true);
    expect(hasBlockedTerm('filho-da-puta')).toBe(true);
  });

  it('deixa passar as palavras do campo', () => {
    for (const ok of ['Limpeza do curral', 'Adubação com bosta de vaca', 'Micronutrientes: B, Cu e Zn', 'Milho crioulo', 'Ninho de pica-pau']) {
      expect(hasBlockedTerm(ok)).toBe(false);
    }
  });

  it('vira o erro "blocked" do formulário, sem mexer no texto', () => {
    const control = new FormControl('Colheita da porra', noBlockedTerms);

    expect(control.errors).toEqual({ blocked: true });
    expect(control.value).toBe('Colheita da porra');
    control.setValue('Colheita de café');
    expect(control.errors).toBeNull();
  });
});
