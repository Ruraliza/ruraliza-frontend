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

// Reduz e converte para WebP no navegador. Falha rápido para arquivo que não é imagem ou grande demais.
export async function preparePhoto(file: File): Promise<Blob> {
  if (!file.type.startsWith('image/')) {
    throw new PhotoError('Escolha um arquivo de imagem (JPEG, PNG, WebP ou AVIF).');
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    // Formato que o navegador não lê: o servidor tenta converter.
    if (file.size > MAX_PHOTO_BYTES) throw new PhotoError('A foto passa de 10 MB. Escolha uma imagem menor.');
    return file;
  }

  const { width, height } = fitInside(bitmap.width, bitmap.height);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) throw new PhotoError('Não foi possível preparar a foto neste navegador.');
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', 0.82));
  if (!blob) throw new PhotoError('Não foi possível preparar a foto neste navegador.');
  return blob; // navegadores sem WebP no canvas devolvem PNG; o servidor converte
}
