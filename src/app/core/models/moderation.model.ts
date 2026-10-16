// Termos recusados em títulos e descrições de vagas e nos textos do perfil (issue #27). É a mesma lista da API
// (src/shared/domain/moderation.ts); o `npm run check:contracts` do backend confere que as duas batem.
// O formulário avisa antes de enviar e a API recusa (400) se algo passar.
export const BLOCKED_TERMS = [
  'caralho', 'caraio', 'caralha', 'porra', 'puta', 'puto', 'putaria', 'putinha', 'merda', 'merdinha',
  'foda', 'foder', 'fuder', 'fodase', 'fodasse', 'fodido', 'fodida', 'fudido', 'fudida',
  'buceta', 'boceta', 'piroca', 'cuzao', 'cuzona',
  'viado', 'boiola', 'baitola', 'bichona', 'sapatona', 'traveco', 'vadia', 'vagabunda',
  'fdp', 'vsf', 'vtnc', 'tnc', 'pqp', 'krl',
  'filho da puta', 'filha da puta', 'vai tomar no cu', 'tomar no cu', 'toma no cu', 'no seu cu', 'pau no cu',
  'vai se foder', 'vai se fuder', 'puta que pariu', 'preto sujo', 'negro imundo'
] as const;
