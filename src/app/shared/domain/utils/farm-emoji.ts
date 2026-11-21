import { apiAsset } from '../../utils/images';

// Emojis do campo para quando não há foto (perfil, fazenda, card de vaga).
// A escolha é fixa para a mesma entrada: não muda ao recarregar nem entre SSR e navegador.

export const PROFILE_EMOJIS = ['🧑‍🌾', '🐄', '🐖', '🐎', '🐑', '🐓', '🐔', '🦆', '🌻', '🌽', '🌾', '🍀'] as const;
export const FARM_EMOJIS = ['🏡', '🌾', '🌽', '🌳', '🌲', '🌴', '⛰️', '🏞️', '🌻', '☀️'] as const;

// Emoji e fotos de cada tipo de serviço (GET /api/categories). Só decoração: um serviço que não esteja
// aqui cai num emoji fixo pelo nome e nas fotos de "Outros". Os emojis precisam existir em public/emoji.
// Mais de uma foto por serviço: vagas vizinhas do mesmo serviço não repetem a mesma foto.
interface ServiceLook { emoji: string; photos: readonly string[]; services: readonly string[] }
const SERVICE_LOOKS: readonly ServiceLook[] = [
  { emoji: '🌾', photos: ['cat-colheita', 'problema'], services: ['Colheita', 'Ensacamento e seleção de grãos'] },
  { emoji: '🌱', photos: ['cat-plantio', 'maos-na-terra'], services: ['Plantio', 'Capina', 'Preparo de canteiro'] },
  { emoji: '🌧️', photos: ['cat-pulverizacao', 'trilha-defensivos'], services: ['Pulverização'] },
  {
    emoji: '🏡', photos: ['cat-manutencao'],
    services: [
      'Manutenção', 'Conserto de cerca', 'Construção de cerca', 'Troca de mourões e esticadores', 'Porteiras e colchetes',
      'Curral, brete e tronco', 'Reforma de galpão, paiol e cocho', 'Pequenas obras de alvenaria'
    ]
  },
  {
    emoji: '🏞️', photos: ['aerea-talhoes', 'por-do-sol'],
    services: [
      'Encanamento e caixa d\'água', 'Limpeza de represa, açude e cisterna', 'Instalação e manutenção de irrigação',
      'Conserto de roda d\'água e carneiro hidráulico'
    ]
  },
  { emoji: '🍀', photos: ['cat-manutencao', 'aerea-talhoes'], services: ['Roçada manual', 'Limpeza de pasto'] },
  { emoji: '🌳', photos: ['aerea-talhoes', 'cat-manutencao'], services: ['Aceiro manual', 'Poda manual'] },
  { emoji: '⛰️', photos: ['aerea-talhoes', 'por-do-sol'], services: ['Conservação de estrada interna'] },
  { emoji: '🐄', photos: ['cat-gado', 'trilha-gado'], services: ['Manejo de gado', 'Vaqueiro e peão', 'Ordenha'] },
  { emoji: '🐓', photos: ['cat-gado', 'trilha-gado'], services: ['Trato de animais'] },
  { emoji: '🐎', photos: ['cat-gado', 'trilha-gado'], services: ['Casqueamento e ferrageamento', 'Doma e lida com cavalos'] },
  { emoji: '🚜', photos: ['cat-maquinas', 'trilha-maquinas'], services: ['Operação de máquinas'] },
  { emoji: '🧑‍🌾', photos: ['cat-outros', 'trabalhador'], services: ['Outros'] }
];
const OTHER_PHOTOS = ['cat-outros', 'trabalhador'] as const;

function lookOf(category: string): ServiceLook | undefined {
  return SERVICE_LOOKS.find((look) => look.services.includes(category));
}

// Mesmo texto (ou número) → mesmo emoji da lista.
export function pickEmoji(seed: string | number, list: readonly string[]): string {
  let hash = 0;
  for (const char of String(seed)) hash = (hash * 31 + (char.codePointAt(0) ?? 0)) >>> 0;
  return list[hash % list.length] ?? '🌱';
}

export function categoryEmoji(category: string): string {
  return lookOf(category)?.emoji ?? pickEmoji(category, FARM_EMOJIS);
}

// Fotos da categoria (as mesmas da landing, do Unsplash, em src/assets) para a vaga sem foto da fazenda.
// O mesmo serviço (seed) sempre recebe a mesma foto.
export function categoryPhoto(category: string, seed = 0): string {
  const files = lookOf(category)?.photos ?? OTHER_PHOTOS;
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
