import { apiAsset } from '../../utils/images';

// Emojis do campo para quando não há foto (perfil, fazenda, card de vaga).
// A escolha é fixa para a mesma entrada: não muda ao recarregar nem entre SSR e navegador.

export const PROFILE_EMOJIS = ['🧑‍🌾', '🐄', '🐖', '🐎', '🐑', '🐓', '🐔', '🦆', '🌻', '🌽', '🌾', '🍀'] as const;
export const FARM_EMOJIS = ['🏡', '🌾', '🌽', '🌳', '🌲', '🌴', '⛰️', '🏞️', '🌻', '☀️'] as const;

const CATEGORY_EMOJIS: Record<string, string> = {
  Colheita: '🌾',
  Plantio: '🌱',
  Manutenção: '🏡',
  Pulverização: '🌧️',
  'Operação de máquinas': '🚜',
  'Manejo de gado': '🐄',
  Outros: '🧑‍🌾'
};

// Mesmo texto (ou número) → mesmo emoji da lista.
export function pickEmoji(seed: string | number, list: readonly string[]): string {
  let hash = 0;
  for (const char of String(seed)) hash = (hash * 31 + (char.codePointAt(0) ?? 0)) >>> 0;
  return list[hash % list.length] ?? '🌱';
}

export function categoryEmoji(category: string): string {
  return CATEGORY_EMOJIS[category] ?? pickEmoji(category, FARM_EMOJIS);
}

// Fotos da categoria (as mesmas da landing, do Unsplash, em src/assets) para a vaga sem foto da fazenda.
// Mais de uma por categoria: vagas vizinhas da mesma categoria não repetem a mesma foto.
const CATEGORY_PHOTOS: Record<string, readonly string[]> = {
  Colheita: ['cat-colheita', 'problema'],
  Plantio: ['cat-plantio', 'maos-na-terra'],
  Manutenção: ['cat-manutencao'],
  Pulverização: ['cat-pulverizacao', 'trilha-defensivos'],
  'Operação de máquinas': ['cat-maquinas', 'trilha-maquinas'],
  'Manejo de gado': ['cat-gado', 'trilha-gado'],
  Outros: ['cat-outros', 'trabalhador']
};

// O mesmo serviço (seed) sempre recebe a mesma foto.
export function categoryPhoto(category: string, seed = 0): string {
  const files = CATEGORY_PHOTOS[category] ?? CATEGORY_PHOTOS['Outros'];
  return `assets/images/landing/${files[seed % files.length]}-800.webp`;
}

// Capa de uma vaga: a primeira foto da fazenda; sem ela, uma foto da categoria.
export function serviceCover(service: { id: number; category: string; farm?: { photos: (string | { url: string })[] } }): string {
  const first = service.farm?.photos[0];
  if (first === undefined) return categoryPhoto(service.category, service.id);
  return apiAsset(typeof first === 'string' ? first : first.url);
}

// Imagem do emoji (estilo Facebook, 64 px) em public/emoji/<codepoints>.webp.
// Para trocar o estilo (ex.: Twemoji ou Noto), basta substituir os arquivos com os mesmos nomes.
export function emojiSrc(emoji: string): string {
  const codepoints = [...emoji].map((char) => (char.codePointAt(0) ?? 0).toString(16)).join('-');
  return `emoji/${codepoints}.webp`;
}
