// Gera os arquivos da marca a partir do desenho do símbolo "R" (grade de 3×4 módulos de 10):
// - public/brand/*.svg: o símbolo nas quatro versões (verde, colorido, branco, preto);
// - public/favicon.svg, public/favicon.ico (16, 32 e 48 px) e public/apple-touch-icon.png;
// - public/icons/: ícones do app instalável (manifest.webmanifest), a versão "maskable"
//   (o sistema recorta em círculo, gota etc.) e o badge monocromático das notificações push.
// O componente Logo (src/app/shared/ui/logo.ts) usa os mesmos caminhos.
// Uso: node scripts/generate-brand-assets.mjs
import { mkdir, writeFile } from 'node:fs/promises';
import sharp from 'sharp';

const PUBLIC = new URL('../public/', import.meta.url);
const BRAND_DIR = new URL('brand/', PUBLIC);
const ICONS_DIR = new URL('icons/', PUBLIC);

const COLORS = { mata: '#005320', verde: '#017D08', broto: '#89C401', ipe: '#FE8400', branco: '#FFFFFF', preto: '#000000' };

const PATHS = {
  bowl: 'M0 10A10 10 0 0 1 10 0H30V10A10 10 0 0 1 20 20V10H10V20H0Z',
  bowlLeft: 'M0 10A10 10 0 0 1 10 0H20V10H10V20H0Z',
  bowlRight: 'M20 0H30V10A10 10 0 0 1 20 20Z',
  leg: 'M10 20H20L30 30V40H20L10 30Z',
  foot: 'M0 30H10V40H0Z'
};

// Cada versão: [caminho, cor] em ordem de pintura.
const VERSIONS = {
  verde: [['bowl', 'mata'], ['leg', 'verde'], ['foot', 'ipe']],
  colorido: [['bowlLeft', 'mata'], ['bowlRight', 'verde'], ['leg', 'broto'], ['foot', 'ipe']],
  branco: [['bowl', 'branco'], ['leg', 'branco'], ['foot', 'branco']],
  preto: [['bowl', 'preto'], ['leg', 'preto'], ['foot', 'preto']],
  // Dentro do ícone do app: parte de cima branca sobre o fundo verde-escuro.
  app: [['bowl', 'branco'], ['leg', 'broto'], ['foot', 'ipe']]
};

const shapes = (version) => VERSIONS[version].map(([path, color]) => `<path d="${PATHS[path]}" fill="${COLORS[color]}"/>`).join('');

const symbolSvg = (version) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 40">${shapes(version)}</svg>\n`;

// Ícone quadrado de 50 com o símbolo centralizado. scale=1 é o desenho original (símbolo com
// 60% da largura e 80% da altura, cantos arredondados). Ícones que o sistema recorta (maskable,
// iPhone) usam fundo sem cantos e o símbolo menor, dentro do círculo seguro de 40% do raio.
function appIconSvg({ radius = 10, scale = 1, version = 'app', background = COLORS.mata } = {}) {
  const x = 25 - 15 * scale;
  const y = 25 - 20 * scale;
  const bg = background ? `<rect width="50" height="50" rx="${radius}" fill="${background}"/>` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50">${bg}<g transform="translate(${x} ${y}) scale(${scale})">${shapes(version)}</g></svg>\n`;
}

const png = (svg, size) =>
  sharp(Buffer.from(svg), { density: Math.ceil((72 * size) / 50) * 2 })
    .resize(size, size)
    .png({ compressionLevel: 9, palette: true, quality: 90, effort: 10 })
    .toBuffer();

// .ico com PNGs dentro (aceito por todos os navegadores atuais).
function ico(images) {
  const header = Buffer.alloc(6 + 16 * images.length);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  let offset = header.length;
  images.forEach(({ size, data }, i) => {
    const entry = 6 + 16 * i;
    header.writeUInt8(size, entry);
    header.writeUInt8(size, entry + 1);
    header.writeUInt16LE(1, entry + 4);
    header.writeUInt16LE(32, entry + 6);
    header.writeUInt32LE(data.length, entry + 8);
    header.writeUInt32LE(offset, entry + 12);
    offset += data.length;
  });
  return Buffer.concat([header, ...images.map((image) => image.data)]);
}

await mkdir(BRAND_DIR, { recursive: true });
await mkdir(ICONS_DIR, { recursive: true });

for (const version of ['verde', 'colorido', 'branco', 'preto']) {
  await writeFile(new URL(`simbolo-${version}.svg`, BRAND_DIR), symbolSvg(version));
}

const favicon = appIconSvg();
await writeFile(new URL('favicon.svg', PUBLIC), favicon);
await writeFile(new URL('icone-app.svg', BRAND_DIR), favicon);

const icoSizes = [16, 32, 48];
await writeFile(new URL('favicon.ico', PUBLIC), ico(await Promise.all(icoSizes.map(async (size) => ({ size, data: await png(favicon, size) })))));

for (const size of [72, 96, 128, 144, 152, 192, 384, 512]) {
  await writeFile(new URL(`icon-${size}.png`, ICONS_DIR), await png(favicon, size));
}

// Android recorta o ícone (círculo, gota etc.). Escala 0,9: o "R" fica quase do tamanho do favicon
// e ainda inteiro num círculo do tamanho do ícone (a 0,76 ele ficava pequeno; a 1 encosta na borda).
const fullBleed = appIconSvg({ radius: 0, scale: 0.9 });
await writeFile(new URL('icon-maskable-512.png', ICONS_DIR), await png(fullBleed, 512));
// O iPhone arredonda os cantos sozinho e não aceita transparência.
await writeFile(new URL('apple-touch-icon.png', PUBLIC), await png(appIconSvg({ radius: 0 }), 180));
// Badge das notificações (barra de status do Android): só o formato conta, a cor é ignorada.
await writeFile(new URL('badge-96.png', ICONS_DIR), await png(appIconSvg({ background: null, version: 'preto', scale: 1.1 }), 96));

console.log('Arquivos da marca gerados em public/, public/brand/ e public/icons/');
