import credits from '../../../../assets/images/landing/credits.json';

export interface PhotoCredit {
  file: string;
  author: string;
  unsplashUrl: string;
  alt: string;
  width: number;
  height: number;
}

export const PHOTO_CREDITS: PhotoCredit[] = credits;

// Falha rápido se a landing pedir uma foto que não foi baixada/registrada.
export function photo(file: string): PhotoCredit {
  const found = PHOTO_CREDITS.find((p) => p.file === file);
  if (!found) {
    throw new Error(`Foto "${file}" não está em assets/images/landing/credits.json.`);
  }
  return found;
}

export interface LandingCategory {
  name: string; // igual ao nome da categoria na API
  photo: string;
  description: string;
}

// Categorias da API (GET /categories) com foto e descrição para a landing.
// A landing é estática: não chama a API.
export const LANDING_CATEGORIES: LandingCategory[] = [
  { name: 'Colheita', photo: 'cat-colheita', description: 'Colheita manual e mecanizada, carga e descarga.' },
  { name: 'Plantio', photo: 'cat-plantio', description: 'Preparo de mudas, plantio e replantio.' },
  { name: 'Pulverização', photo: 'cat-pulverizacao', description: 'Aplicação costal e mecanizada de defensivos.' },
  { name: 'Operação de máquinas', photo: 'cat-maquinas', description: 'Tratores, colheitadeiras e implementos.' },
  { name: 'Manejo de gado', photo: 'cat-gado', description: 'Lida com o rebanho, vacinação e ordenha.' },
  { name: 'Manutenção', photo: 'cat-manutencao', description: 'Cercas, roçada, limpeza de pasto e reparos.' },
  { name: 'Outros', photo: 'cat-outros', description: 'Secagem, beneficiamento e o que mais a safra pedir.' }
];

// Fim do título do hero: artigo + trabalho, trocando a cada 2,4 s.
export const HERO_ROTATING_WORDS = ['da colheita', 'do plantio', 'da roçada', 'da ordenha', 'da pulverização'];
