// QR code (ISO/IEC 18004) de um texto, para o link de validação impresso no certificado.
// Só o que o certificado precisa: modo byte (UTF-8), correção de erros nível M (o código continua legível
// com ~15% do símbolo sujo ou rasgado), a menor versão em que o texto cabe e a máscara de menor penalidade.
// Segue o gerador de referência do Project Nayuki (https://www.nayuki.io/page/qr-code-generator-library, MIT).

import { reedSolomonDivisor, reedSolomonRemainder } from './qr-reed-solomon';

export interface QrSymbol {
  version: number; // 1 a 40
  size: number; // módulos por lado (4 × versão + 17), sem a margem clara
  modules: boolean[][]; // [linha][coluna]; true = escuro
}

// Nível M, por versão (o índice 0 não é usado): códigos de correção por bloco e quantidade de blocos.
const ECC_PER_BLOCK = [
  -1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28, 28, 28, 28, 28, 28,
  28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28
];
const BLOCKS = [
  -1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23, 25, 26, 28, 29, 31, 33,
  35, 37, 38, 40, 43, 45, 47, 49
];
const LEVEL_M = 0b00; // o nível nos bits de formato (L = 01, M = 00, Q = 11, H = 10)

// As 8 máscaras: inverte o módulo (coluna x, linha y) quando a condição vale.
const MASKS: readonly ((x: number, y: number) => boolean)[] = [
  (x, y) => (x + y) % 2 === 0,
  (_x, y) => y % 2 === 0,
  (x) => x % 3 === 0,
  (x, y) => (x + y) % 3 === 0,
  (x, y) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0,
  (x, y) => ((x * y) % 2) + ((x * y) % 3) === 0,
  (x, y) => (((x * y) % 2) + ((x * y) % 3)) % 2 === 0,
  (x, y) => (((x + y) % 2) + ((x * y) % 3)) % 2 === 0
];

interface Grid {
  size: number;
  dark: boolean[][];
  fixed: boolean[][]; // padrões de função: não recebem dados nem máscara
}

export function encodeQr(text: string): QrSymbol {
  const bytes = new TextEncoder().encode(text);
  const version = smallestVersion(bytes.length);
  const size = version * 4 + 17;
  const blank = (): boolean[][] => Array.from({ length: size }, () => new Array<boolean>(size).fill(false));
  const grid: Grid = { size, dark: blank(), fixed: blank() };

  drawFunctionPatterns(grid, version);
  placeData(grid, withErrorCorrection(dataCodewords(bytes, version), version));
  const mask = bestMask(grid);
  applyMask(grid, mask);
  drawFormatBits(grid, mask);
  return { version, size, modules: grid.dark };
}

// Desenho em SVG: um retângulo por trecho de módulos escuros seguidos em cada linha, deslocado pela
// margem clara (`margin` módulos; o padrão pede 4). viewBox: 0 0 (size + 2 × margin) (size + 2 × margin).
export function qrPath(qr: QrSymbol, margin = 4): string {
  const parts: string[] = [];
  qr.modules.forEach((row, y) => {
    for (let x = 0; x < qr.size; x++) {
      if (!row[x]) continue;
      const start = x;
      while (x + 1 < qr.size && row[x + 1]) x++;
      parts.push(`M${start + margin} ${y + margin}h${x - start + 1}v1h-${x - start + 1}z`);
    }
  });
  return parts.join('');
}

// --- Dados ---

function rawModules(version: number): number {
  let result = (16 * version + 128) * version + 64;
  if (version >= 2) {
    const align = Math.floor(version / 7) + 2;
    result -= (25 * align - 10) * align - 55;
    if (version >= 7) result -= 36;
  }
  return result;
}

function dataCapacity(version: number): number {
  return Math.floor(rawModules(version) / 8) - ECC_PER_BLOCK[version] * BLOCKS[version];
}

function smallestVersion(byteCount: number): number {
  for (let version = 1; version <= 40; version++) {
    if (4 + (version <= 9 ? 8 : 16) + byteCount * 8 <= dataCapacity(version) * 8) return version;
  }
  throw new RangeError('Texto longo demais para um QR code.');
}

// Modo byte (0100), quantidade de bytes, os bytes, terminador e preenchimento (0xEC 0x11 alternados).
function dataCodewords(bytes: Uint8Array, version: number): number[] {
  const capacity = dataCapacity(version) * 8;
  const bits: number[] = [];
  const push = (value: number, length: number): void => {
    for (let i = length - 1; i >= 0; i--) bits.push((value >>> i) & 1);
  };
  push(0b0100, 4);
  push(bytes.length, version <= 9 ? 8 : 16);
  bytes.forEach((byte) => push(byte, 8));
  push(0, Math.min(4, capacity - bits.length));
  push(0, (8 - (bits.length % 8)) % 8);

  const codewords: number[] = [];
  for (let i = 0; i < bits.length; i += 8) codewords.push(bits.slice(i, i + 8).reduce((byte, bit) => (byte << 1) | bit, 0));
  for (let pad = 0xec; codewords.length < capacity / 8; pad ^= 0xec ^ 0x11) codewords.push(pad);
  return codewords;
}

// Divide em blocos, calcula a correção (Reed-Solomon) de cada um e intercala: os dados de todos os
// blocos, byte a byte, depois a correção. Os blocos longos têm um byte de dados a mais.
function withErrorCorrection(data: number[], version: number): number[] {
  const blockCount = BLOCKS[version];
  const eccLength = ECC_PER_BLOCK[version];
  const total = Math.floor(rawModules(version) / 8);
  const shortBlocks = blockCount - (total % blockCount);
  const shortData = Math.floor(total / blockCount) - eccLength;
  const divisor = reedSolomonDivisor(eccLength);

  const blocks: { data: number[]; ecc: number[] }[] = [];
  for (let i = 0, offset = 0; i < blockCount; i++) {
    const part = data.slice(offset, (offset += shortData + (i < shortBlocks ? 0 : 1)));
    blocks.push({ data: part, ecc: reedSolomonRemainder(part, divisor) });
  }
  const result: number[] = [];
  for (let i = 0; i <= shortData; i++) blocks.forEach((block) => i < block.data.length && result.push(block.data[i]));
  for (let i = 0; i < eccLength; i++) blocks.forEach((block) => result.push(block.ecc[i]));
  return result;
}


// --- Padrões de função ---

function setFixed(grid: Grid, x: number, y: number, dark: boolean): void {
  grid.dark[y][x] = dark;
  grid.fixed[y][x] = true;
}

function drawFunctionPatterns(grid: Grid, version: number): void {
  const { size } = grid;
  for (let i = 0; i < size; i++) {
    setFixed(grid, 6, i, i % 2 === 0); // padrões de tempo
    setFixed(grid, i, 6, i % 2 === 0);
  }
  drawFinder(grid, 3, 3);
  drawFinder(grid, size - 4, 3);
  drawFinder(grid, 3, size - 4);

  const positions = alignmentPositions(version, size);
  const last = positions.length - 1;
  positions.forEach((x, i) =>
    positions.forEach((y, j) => {
      // Três cantos já têm os padrões de localização.
      if (!((i === 0 && j === 0) || (i === 0 && j === last) || (i === last && j === 0))) drawAlignment(grid, x, y);
    })
  );
  drawFormatBits(grid, 0); // reserva a área; os bits de verdade vêm depois da escolha da máscara
  drawVersion(grid, version);
}

// Padrão de localização 7×7 com a borda clara em volta (centro em x, y).
function drawFinder(grid: Grid, cx: number, cy: number): void {
  for (let dy = -4; dy <= 4; dy++) {
    for (let dx = -4; dx <= 4; dx++) {
      const x = cx + dx;
      const y = cy + dy;
      const ring = Math.max(Math.abs(dx), Math.abs(dy));
      if (x >= 0 && x < grid.size && y >= 0 && y < grid.size) setFixed(grid, x, y, ring !== 2 && ring !== 4);
    }
  }
}

function drawAlignment(grid: Grid, cx: number, cy: number): void {
  for (let dy = -2; dy <= 2; dy++) {
    for (let dx = -2; dx <= 2; dx++) setFixed(grid, cx + dx, cy + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
  }
}

// Centros dos padrões de alinhamento (iguais nas linhas e nas colunas).
function alignmentPositions(version: number, size: number): number[] {
  if (version === 1) return [];
  const count = Math.floor(version / 7) + 2;
  const step = Math.floor((version * 8 + count * 3 + 5) / (count * 4 - 4)) * 2;
  const result = [6];
  for (let position = size - 7; result.length < count; position -= step) result.splice(1, 0, position);
  return result;
}

// Nível de correção e máscara (5 bits + 10 de correção BCH), em duas cópias.
function drawFormatBits(grid: Grid, mask: number): void {
  const data = (LEVEL_M << 3) | mask;
  let remainder = data;
  for (let i = 0; i < 10; i++) remainder = (remainder << 1) ^ ((remainder >>> 9) * 0x537);
  const bits = ((data << 10) | remainder) ^ 0x5412;
  const bit = (i: number): boolean => ((bits >>> i) & 1) !== 0;
  const { size } = grid;

  for (let i = 0; i <= 5; i++) setFixed(grid, 8, i, bit(i));
  setFixed(grid, 8, 7, bit(6));
  setFixed(grid, 8, 8, bit(7));
  setFixed(grid, 7, 8, bit(8));
  for (let i = 9; i < 15; i++) setFixed(grid, 14 - i, 8, bit(i));

  for (let i = 0; i < 8; i++) setFixed(grid, size - 1 - i, 8, bit(i));
  for (let i = 8; i < 15; i++) setFixed(grid, 8, size - 15 + i, bit(i));
  setFixed(grid, 8, size - 8, true); // módulo sempre escuro
}

// Versão 7 em diante: 6 bits da versão + 12 de correção, em dois blocos 3×6.
function drawVersion(grid: Grid, version: number): void {
  if (version < 7) return;
  let remainder = version;
  for (let i = 0; i < 12; i++) remainder = (remainder << 1) ^ ((remainder >>> 11) * 0x1f25);
  const bits = (version << 12) | remainder;
  for (let i = 0; i < 18; i++) {
    const dark = ((bits >>> i) & 1) !== 0;
    const a = grid.size - 11 + (i % 3);
    const b = Math.floor(i / 3);
    setFixed(grid, a, b, dark);
    setFixed(grid, b, a, dark);
  }
}

// --- Dados no símbolo e máscara ---

// Em zigue-zague, de duas em duas colunas, da direita para a esquerda, subindo e descendo.
function placeData(grid: Grid, codewords: readonly number[]): void {
  const { size } = grid;
  let i = 0;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5; // a coluna do padrão de tempo não entra
    const upward = ((right + 1) & 2) === 0;
    for (let step = 0; step < size; step++) {
      const y = upward ? size - 1 - step : step;
      for (let x = right; x > right - 2; x--) {
        if (grid.fixed[y][x] || i >= codewords.length * 8) continue;
        grid.dark[y][x] = ((codewords[i >>> 3] >>> (7 - (i & 7))) & 1) !== 0;
        i++;
      }
    }
  }
}

function applyMask(grid: Grid, mask: number): void {
  const invert = MASKS[mask];
  for (let y = 0; y < grid.size; y++) {
    for (let x = 0; x < grid.size; x++) if (!grid.fixed[y][x] && invert(x, y)) grid.dark[y][x] = !grid.dark[y][x];
  }
}

function bestMask(grid: Grid): number {
  let best = 0;
  let lowest = Infinity;
  for (let mask = 0; mask < MASKS.length; mask++) {
    applyMask(grid, mask);
    drawFormatBits(grid, mask);
    const score = penalty(grid);
    if (score < lowest) [best, lowest] = [mask, score];
    applyMask(grid, mask); // desfaz (inverter de novo)
  }
  return best;
}

// Penalidades do padrão: sequências de 5+ da mesma cor, quadrados 2×2, trechos parecidos com o
// padrão de localização e o desequilíbrio entre escuros e claros. A menor ajuda a leitura.
function penalty(grid: Grid): number {
  const { size, dark } = grid;
  let result = 0;
  for (let i = 0; i < size; i++) result += linePenalty(dark[i]) + linePenalty(dark.map((row) => row[i]));
  for (let y = 0; y < size - 1; y++) {
    for (let x = 0; x < size - 1; x++) {
      const color = dark[y][x];
      if (color === dark[y][x + 1] && color === dark[y + 1][x] && color === dark[y + 1][x + 1]) result += 3;
    }
  }
  const darkCount = dark.reduce((sum, row) => sum + row.filter(Boolean).length, 0);
  const total = size * size;
  return result + (Math.ceil(Math.abs(darkCount * 20 - total * 10) / total) - 1) * 10;
}

// Uma linha ou coluna, com a margem clara em volta: sequências longas (regra 1) e 1:1:3:1:1 com 4 claros
// de um dos lados (regra 3), contadas pelo histórico das 7 últimas sequências.
function linePenalty(line: readonly boolean[]): number {
  const size = line.length;
  const history = [0, 0, 0, 0, 0, 0, 0];
  const addRun = (length: number): void => {
    history.pop();
    history.unshift(history[0] === 0 ? length + size : length); // a primeira sequência começa na margem
  };
  const finderLike = (): number => {
    const [newest, n, b, c, d, e, oldest] = history;
    const core = n > 0 && b === n && c === n * 3 && d === n && e === n;
    return (core && newest >= n * 4 && oldest >= n ? 1 : 0) + (core && oldest >= n * 4 && newest >= n ? 1 : 0);
  };

  let result = 0;
  let color = false;
  let run = 0;
  for (const dark of line) {
    if (dark === color) {
      run++;
      if (run === 5) result += 3;
      else if (run > 5) result++;
    } else {
      addRun(run);
      if (!color) result += finderLike() * 40;
      color = dark;
      run = 1;
    }
  }
  if (color) {
    addRun(run);
    run = 0;
  }
  addRun(run + size); // a última sequência termina na margem
  return result + finderLike() * 40;
}
