import { environment } from '../../../environments/environment';

// Fotos: o servidor é quem garante a regra (≤ 1000px, WebP, sem metadados).
// Aqui a foto só é reduzida ANTES do envio, para economizar dados em conexão ruim no campo
// (uma foto de celular de 4 MB vira ~150 KB). Se o navegador não conseguir ler o arquivo
// (ex.: HEIC fora do Safari), o original é enviado e o servidor decide.

export const MAX_PHOTO_SIDE = 1000;
export const MAX_PHOTO_BYTES = 10 * 1024 * 1024; // limite do servidor
export const ACCEPTED_PHOTOS = 'image/jpeg,image/png,image/webp,image/avif,image/heic,image/heif';

// URL da API (ex.: /api/images/x.webp) → endereço completo do servidor da API.
export function apiAsset(url: string): string {
  return new URL(url, environment.apiUrl).href;
}

// Tamanho final (≤ maxSide no maior lado, sem ampliar).
export function fitInside(width: number, height: number, maxSide = MAX_PHOTO_SIDE): { width: number; height: number } {
  const scale = Math.min(1, maxSide / Math.max(width, height));
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}

export class PhotoError extends Error {}

// Abre a foto no navegador (já girada pelo EXIF). Falha rápido para arquivo que não é imagem;
// devolve null para formato que o navegador não lê (ex.: HEIC fora do Safari): aí o original
// segue para o servidor, que converte (e, na foto de perfil, recorta o quadrado central).
export async function loadPhoto(file: File): Promise<ImageBitmap | null> {
  if (!file.type.startsWith('image/')) {
    throw new PhotoError('Escolha um arquivo de imagem (JPEG, PNG, WebP ou AVIF).');
  }
  try {
    return await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    if (file.size > MAX_PHOTO_BYTES) throw new PhotoError('A foto passa de 10 MB. Escolha uma imagem menor.');
    return null;
  }
}

// Reduz e converte para WebP no navegador.
export async function preparePhoto(file: File): Promise<Blob> {
  const bitmap = await loadPhoto(file);
  if (!bitmap) return file;

  const { width, height } = fitInside(bitmap.width, bitmap.height);
  return drawToWebp(bitmap, { x: 0, y: 0, width: bitmap.width, height: bitmap.height }, width, height);
}

// --- Recorte quadrado (foto de perfil) ---

// Quadrado na foto original, em pixels: canto superior esquerdo e lado.
export interface SquareCrop {
  x: number;
  y: number;
  size: number;
}

// Maior quadrado possível, no centro da foto (ponto de partida do recorte).
export function centeredCrop(width: number, height: number): SquareCrop {
  const size = Math.min(width, height);
  return { x: (width - size) / 2, y: (height - size) / 2, size };
}

// Mantém o quadrado dentro da foto (lado entre 1px e o menor lado).
export function clampCrop(crop: SquareCrop, width: number, height: number): SquareCrop {
  const size = Math.min(Math.max(crop.size, 1), width, height);
  return {
    x: Math.min(Math.max(crop.x, 0), width - size),
    y: Math.min(Math.max(crop.y, 0), height - size),
    size
  };
}

// Muda o lado do quadrado (zoom) sem tirar o centro do lugar, e ajusta para caber na foto.
export function resizeCrop(crop: SquareCrop, size: number, width: number, height: number): SquareCrop {
  const centerX = crop.x + crop.size / 2;
  const centerY = crop.y + crop.size / 2;
  return clampCrop({ x: centerX - size / 2, y: centerY - size / 2, size }, width, height);
}

// Recorta o quadrado e devolve WebP com no máximo 1000px de lado (sem ampliar).
export function cropSquare(bitmap: ImageBitmap, crop: SquareCrop): Promise<Blob> {
  const side = Math.max(1, Math.round(Math.min(crop.size, MAX_PHOTO_SIDE)));
  return drawToWebp(bitmap, { x: crop.x, y: crop.y, width: crop.size, height: crop.size }, side, side);
}

async function drawToWebp(
  bitmap: ImageBitmap,
  source: { x: number; y: number; width: number; height: number },
  width: number,
  height: number
): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) throw new PhotoError('Não foi possível preparar a foto neste navegador.');
  context.imageSmoothingQuality = 'high';
  context.drawImage(bitmap, source.x, source.y, source.width, source.height, 0, 0, width, height);

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', 0.82));
  if (!blob) throw new PhotoError('Não foi possível preparar a foto neste navegador.');
  return blob; // navegadores sem WebP no canvas devolvem PNG; o servidor converte
}
