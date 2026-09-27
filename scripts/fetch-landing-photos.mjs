// Baixa as fotos da landing do Unsplash (sem hotlink): WebP em 480/800/1600/2400px,
// miniatura quadrada para o marquee e registra créditos em credits.json.
// Uso: node scripts/fetch-landing-photos.mjs
import { access, mkdir, writeFile } from 'node:fs/promises';
import { setTimeout as sleep } from 'node:timers/promises';

const OUT = new URL('../src/assets/images/landing/', import.meta.url);
const WIDTHS = [480, 800, 1600, 2400];

// file: nome local · photo: id do CDN · slug: página no Unsplash · alt: descrição em português
const PHOTOS = [
  { file: 'hero-colheita', photo: '1605000797499-95a51c5269ae', slug: 'homem-em-moletom-cinza-e-calcas-pretas-segurando-caixa-de-papelao-marrom-xDwEa2kaeJA', author: 'Tim Mossholder', alt: 'Equipe de colheita atravessa uma lavoura verde carregando caixas nos ombros' },
  { file: 'cat-colheita', photo: '1746623691157-c4c7a3bad0c4', slug: 'agricultor-colhendo-cerejas-de-cafe-em-um-campo-1-ZUhMFleK0', author: 'Luba Glazunova', alt: 'Trabalhadora de chapéu colhe cerejas de café maduras no pé' },
  { file: 'cat-plantio', photo: '1509099381441-ea3c0cf98b94', slug: 'plantio-de-mulheres-durante-o-dia-QYcSeY7vuZM', author: 'Annie Spratt', alt: 'Mulheres plantam mudas em fileiras numa área preparada' },
  { file: 'cat-maquinas', photo: '1635174815612-fd9636f70146', slug: 'duas-colheitadeiras-verdes-em-um-grande-campo-de-trigo-fqoq39Jj5us', author: 'Darla Hueske', alt: 'Duas colheitadeiras trabalham lado a lado numa lavoura de grãos' },
  { file: 'cat-gado', photo: '1650397306390-86caaefce1a3', slug: 'um-grupo-de-pessoas-em-cavalos-pastoreando-gado-em-um-campo-UsIH5HIHvbE', author: 'Bailey Alexander', alt: 'Vaqueiros a cavalo conduzem o rebanho pelo pasto' },
  { file: 'cat-manutencao', photo: '1556603235-0f484147fda4', slug: 'cerca-de-madeira-marrom-em-um-campo-verde-durante-o-dia-GngYPhnoYcs', author: 'Francisco Delgado', alt: 'Cerca de madeira atravessa um pasto verde' },
  { file: 'cat-pulverizacao', photo: '1656407410275-e63e689bcd90', slug: 'trator-pulverizando-campo-verde-hGzbN1vy_CA', author: 'Marios Gkortsilas', alt: 'Vista aérea de um trator pulverizando uma lavoura verde' },
  { file: 'cat-outros', photo: '1633281121789-69e58edec7f6', slug: 'duas-mulheres-estao-trabalhando-na-sujeira-com-uma-pa-dPHgM3l8_NU', author: 'Nischal Masand', alt: 'Duas trabalhadoras revolvem grãos secando no terreiro com rodos' },
  { file: 'problema', photo: '1626906722163-bd4c03cb3b9b', slug: 'homem-em-moletom-cinza-e-jeans-azuis-ajoelhados-no-campo-de-grama-verde-durante-o-dia-Kx060cRsmt0', author: 'Tim Mossholder', alt: 'Duas pessoas curvadas colhem à mão numa lavoura baixa' },
  { file: 'produtor', photo: '1537721664796-76f77222a5d0', slug: 'homem-em-pe-no-jardim-durante-o-dia-QFmNQXLPbZc', author: 'Gregory Hayes', alt: 'Produtor em pé entre as fileiras da própria lavoura' },
  { file: 'trabalhador', photo: '1673538064334-72dcb3cbf181', slug: 'um-homem-de-camisa-laranja-esta-trabalhando-em-um-campo-HFXurfNzDeE', author: 'Shakib Uzzaman', alt: 'Trabalhador de camisa laranja cuida das plantas no campo' },
  { file: 'maos-na-terra', photo: '1590682680695-43b964a3ae17', slug: 'plantando-mudas-com-maos-em-solo-escuro-bYZn_C-RswQ', author: 'GreenForce Staffing', alt: 'Mãos sujas de terra plantam uma muda pequena' },
  { file: 'aerea-talhoes', photo: '1516822277566-bb38424a2b77', slug: 'foto-vista-panoramica-de-campos-de-plantas-RUj5b4YXaHE', author: 'jean wimmerlin', alt: 'Vista aérea de talhões com culturas de cores diferentes' },
  { file: 'por-do-sol', photo: '1717702576954-c07131c54169', slug: 'um-trator-arando-um-campo-ao-por-do-sol-_dnc3j1oVlk', author: 'Tom De Decker', alt: 'Trator ara o campo ao pôr do sol' },
  { file: 'trilha-defensivos', photo: '1711900177627-1182b446bc8f', slug: 'uma-pessoa-pulverizando-pesticida-em-um-campo-verde-vHdyEGfNfy0', author: 'Dibakar Roy', alt: 'Trabalhador aplica defensivo com pulverizador costal na lavoura' },
  { file: 'trilha-maquinas', photo: '1633551734618-1fc05ba07290', slug: 'uma-pessoa-andando-em-um-campo-ao-lado-de-um-trator-hh0zp8A8mEI', author: 'Xhois Shaholli', alt: 'Pessoa caminha ao lado de um trator no fim da tarde' },
  { file: 'trilha-gado', photo: '1774828732384-6c0134c29425', slug: 'dois-touros-brahman-em-um-campo-gramado-rcJdTs_RVC0', author: 'Abby Moulton', alt: 'Dois touros de raça zebuína no pasto' }
];

// Miniaturas quadradas para a faixa de categorias.
const THUMBS = ['cat-colheita', 'cat-plantio', 'cat-maquinas', 'cat-gado', 'cat-manutencao', 'cat-pulverizacao', 'cat-outros'];

// O Unsplash responde 429 quando há muitas requisições seguidas: espera e tenta de novo.
async function fetchRetry(url, init) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const res = await fetch(url, init);
    if (res.status !== 429) return res;
    await sleep(5000 * 2 ** attempt);
  }
  throw new Error(`Unsplash continua respondendo 429 para ${url}. Tente de novo mais tarde.`);
}

const exists = (url) => access(url).then(() => true, () => false);

async function fetchOk(url) {
  const res = await fetchRetry(url);
  if (!res.ok) throw new Error(`${res.status} ao baixar ${url}`);
  return res;
}

await mkdir(OUT, { recursive: true });
const credits = [];

for (const p of PHOTOS) {
  // Confere que a página da foto existe antes de usar.
  const page = await fetchRetry(`https://unsplash.com/photos/${p.slug}`, { method: 'HEAD', redirect: 'follow' });
  if (!page.ok) throw new Error(`Página da foto não encontrada: ${p.slug} (${page.status})`);

  const base = `https://images.unsplash.com/photo-${p.photo}`;
  const meta = await (await fetchOk(`${base}?fm=json`)).json();
  const ratio = meta.PixelHeight / meta.PixelWidth;

  for (const w of WIDTHS) {
    if (await exists(new URL(`${p.file}-${w}.webp`, OUT))) continue;
    const img = await fetchOk(`${base}?w=${w}&fm=webp&q=${w > 1600 ? 62 : w > 800 ? 70 : 58}`);
    await writeFile(new URL(`${p.file}-${w}.webp`, OUT), Buffer.from(await img.arrayBuffer()));
  }
  if (THUMBS.includes(p.file)) {
    const img = await fetchOk(`${base}?w=160&h=160&fit=crop&crop=entropy&fm=webp&q=70`);
    await writeFile(new URL(`${p.file}-thumb.webp`, OUT), Buffer.from(await img.arrayBuffer()));
  }

  credits.push({
    file: p.file,
    author: p.author,
    unsplashUrl: `https://unsplash.com/photos/${p.slug}`,
    alt: p.alt,
    width: 2400,
    height: Math.round(2400 * ratio)
  });
  console.log(`ok ${p.file} (${meta.PixelWidth}x${meta.PixelHeight})`);
}

await writeFile(new URL('credits.json', OUT), JSON.stringify(credits, null, 2) + '\n');
console.log(`${credits.length} fotos salvas em src/assets/images/landing/`);
