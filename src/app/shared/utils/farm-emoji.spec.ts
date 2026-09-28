import { FARM_EMOJIS, PROFILE_EMOJIS, categoryEmoji, emojiSrc, pickEmoji } from './farm-emoji';

describe('farm-emoji', () => {
  it('always picks the same emoji for the same person', () => {
    expect(pickEmoji('Maria Trabalhadora', PROFILE_EMOJIS)).toBe(pickEmoji('Maria Trabalhadora', PROFILE_EMOJIS));
    expect(PROFILE_EMOJIS).toContain(pickEmoji('João Produtor', PROFILE_EMOJIS));
  });

  it('spreads different people across the list', () => {
    const names = ['Ana', 'Bruno', 'Carla', 'Diego', 'Elisa', 'Fábio', 'Gabi', 'Hugo'];
    expect(new Set(names.map((n) => pickEmoji(n, PROFILE_EMOJIS))).size).toBeGreaterThan(3);
  });

  it('uses the category to choose the emoji of a job', () => {
    expect(categoryEmoji('Colheita')).toBe('🌾');
    expect(categoryEmoji('Manejo de gado')).toBe('🐄');
    expect(categoryEmoji('Operação de máquinas')).toBe('🚜');
    expect(FARM_EMOJIS).toContain(categoryEmoji('Categoria nova'));
  });
});

describe('emojiSrc', () => {
  it('points to the image file named by the codepoints', () => {
    expect(emojiSrc('🐄')).toBe('emoji/1f404.webp');
    expect(emojiSrc('🧑‍🌾')).toBe('emoji/1f9d1-200d-1f33e.webp');
    expect(emojiSrc('☀️')).toBe('emoji/2600-fe0f.webp');
  });
});
