import { isUf } from './ufs';

// Ponto marcado no mapa, no formato da API (graus decimais).
export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export interface AddressSuggestion {
  address: string;
  city: string;
  state: string;
}

// Só o que usamos de google.maps.GeocoderResult (assim o teste não depende do SDK do Maps).
export interface GeocoderResultLike {
  address_components: { long_name: string; short_name: string; types: string[] }[];
}

// Endereço, cidade e UF a partir do geocoding reverso do Google. Campos não encontrados ficam vazios.
export function parseGeocoderResult(result: GeocoderResultLike): AddressSuggestion {
  const find = (type: string) => result.address_components.find((c) => c.types.includes(type));

  const route = find('route')?.long_name ?? '';
  const number = find('street_number')?.long_name ?? '';
  const city = find('administrative_area_level_2') ?? find('locality');
  const uf = find('administrative_area_level_1')?.short_name ?? '';

  return {
    address: route && number ? `${route}, ${number}` : route,
    city: city?.long_name ?? '',
    state: isUf(uf) ? uf : ''
  };
}

// Distância aproximada em metros (haversine). Serve para ignorar ajustes pequenos do alfinete.
export function distanceMeters(a: GeoPoint, b: GeoPoint): number {
  const R = 6371000;
  const rad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = rad(b.latitude - a.latitude);
  const dLng = rad(b.longitude - a.longitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// Chave de cache do geocoding: 3 casas decimais ≈ quadrado de 110 m.
export function geocodeCacheKey(point: GeoPoint): string {
  return `${point.latitude.toFixed(3)},${point.longitude.toFixed(3)}`;
}

// "-22.11650, -43.20920": leitura do ponto para quem não vê o mapa.
export function formatPoint(point: GeoPoint): string {
  return `${point.latitude.toFixed(5)}, ${point.longitude.toFixed(5)}`;
}

// Link do Google Maps (abre o app no celular, com rotas até o ponto).
export function mapsLink(point: GeoPoint): string {
  return `https://www.google.com/maps/search/?api=1&query=${point.latitude},${point.longitude}`;
}

// Iframe da Maps Embed API: gratuito e sem limite de uso (não conta na cota do Maps JavaScript).
export function embedUrl(apiKey: string, point: GeoPoint): string {
  const params = new URLSearchParams({
    key: apiKey,
    q: `${point.latitude},${point.longitude}`,
    zoom: '15',
    maptype: 'satellite',
    language: 'pt-BR',
    region: 'BR'
  });
  return `https://www.google.com/maps/embed/v1/place?${params}`;
}

// Coordenadas da fazenda, se o ponto já foi marcado (fazendas antigas têm null; o trabalhador
// só recebe o ponto quando é o aceito no serviço).
export function pointOf(farm: { latitude?: number | null; longitude?: number | null }): GeoPoint | null {
  const { latitude, longitude } = farm;
  return latitude == null || longitude == null ? null : { latitude, longitude };
}
