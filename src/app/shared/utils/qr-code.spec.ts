import { encodeQr, qrPath } from './qr-code';

const rows = (text: string): string[] => encodeQr(text).modules.map((row) => row.map((dark) => (dark ? '#' : '.')).join(''));

describe('encodeQr', () => {
  it('gera o símbolo que os leitores de QR code leem', () => {
    // Lido pelo jsQR (decodificador independente) como "Ruraliza", versão 1. As versões 1 a 40 também
    // foram conferidas assim, com textos de vários tamanhos.
    expect(rows('Ruraliza')).toEqual([
      '#######..##.#.#######',
      '#.....#...###.#.....#',
      '#.###.#.#.##..#.###.#',
      '#.###.#.###.#.#.###.#',
      '#.###.#.#.###.#.###.#',
      '#.....#.#...#.#.....#',
      '#######.#.#.#.#######',
      '........##.##........',
      '#.#####..#..#.#####..',
      '##.##..#..#.#..######',
      '.#.##.#.#.##.#...###.',
      '.#####..##.....####.#',
      '...##.##..##...###...',
      '........#..####.#.##.',
      '#######..#..#.#....#.',
      '#.....#.##.####..##..',
      '#.###.#.###.#..##...#',
      '#.###.#.#.#.#..##.#..',
      '#.###.#.####.#...##..',
      '#.....#...#....#.##..',
      '#######.#..#.#..#..#.'
    ]);
  });

  it('usa a menor versão em que o texto cabe (bytes em UTF-8)', () => {
    const version = (text: string): number => encodeQr(text).version;

    expect([version('a'.repeat(14)), version('a'.repeat(15)), version('a'.repeat(62)), version('a'.repeat(63))]).toEqual([1, 2, 4, 5]);
    expect([version('ç'.repeat(7)), version('ç'.repeat(8))]).toEqual([1, 2]);
    // O link de validação de um certificado: 33 × 33 módulos.
    expect(encodeQr('https://ruraliza.github.io/certificados/RZ-7K3Q-9FMA-2X').size).toBe(33);
    expect(() => encodeQr('a'.repeat(2332))).toThrow(RangeError);
  });

  it('desenha um retângulo por trecho escuro de cada linha, dentro da margem clara', () => {
    const symbol = encodeQr('Ruraliza');
    const path = qrPath(symbol);
    const dark = symbol.modules.flat().filter(Boolean).length;
    const drawn = [...path.matchAll(/h(\d+)v1/g)].reduce((sum, [, width]) => sum + Number(width), 0);

    expect(path.startsWith('M4 4h7v1h-7z')).toBe(true); // a primeira linha do padrão de localização
    expect(drawn).toBe(dark);
  });
});
