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

// Imagem do emoji (estilo Facebook, 64 px) em public/emoji/<codepoints>.webp.
// Para trocar o estilo (ex.: Twemoji ou Noto), basta substituir os arquivos com os mesmos nomes.
export function emojiSrc(emoji: string): string {
  const codepoints = [...emoji].map((char) => (char.codePointAt(0) ?? 0).toString(16)).join('-');
  return `emoji/${codepoints}.webp`;
}
