// Gera os ícones do app instalável (manifest.webmanifest) a partir de public/favicon.svg:
// PNGs quadrados em public/icons/ e uma versão "maskable" (o sistema recorta em círculo,
// gota etc.), com o logo dentro da zona segura de 80% sobre o verde da marca.
// Uso: node scripts/generate-pwa-icons.mjs
import { mkdir, readFile } from 'node:fs/promises';
import sharp from 'sharp';

const SVG = new URL('../public/favicon.svg', import.meta.url);
const OUT = new URL('../public/icons/', import.meta.url);
const SIZES = [72, 96, 128, 144, 152, 192, 384, 512];
const BRAND = '#00552A';
const MASKABLE_SIZE = 512;
const SAFE_ZONE = 0.8;

const svg = await readFile(SVG);
await mkdir(OUT, { recursive: true });

for (const size of SIZES) {
  await sharp(svg, { density: 72 * (size / 64) * 2 }).resize(size, size).png().toFile(new URL(`icon-${size}.png`, OUT).pathname);
}

const logoSize = Math.round(MASKABLE_SIZE * SAFE_ZONE);
const logo = await sharp(svg, { density: 72 * (logoSize / 64) * 2 }).resize(logoSize, logoSize).png().toBuffer();
await sharp({ create: { width: MASKABLE_SIZE, height: MASKABLE_SIZE, channels: 4, background: BRAND } })
  .composite([{ input: logo, gravity: 'center' }])
  .png()
  .toFile(new URL(`icon-maskable-${MASKABLE_SIZE}.png`, OUT).pathname);

console.log(`Ícones gerados em ${OUT.pathname}`);
