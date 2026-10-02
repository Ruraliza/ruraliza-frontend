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

// "-22.11650, -43.20920": leitura do ponto para quem não vê o mapa.
export function formatPoint(point: GeoPoint): string {
  return `${point.latitude.toFixed(5)}, ${point.longitude.toFixed(5)}`;
}

// Link do Google Maps (abre o app no celular, com rotas até o ponto).
export function mapsLink(point: GeoPoint): string {
  return `https://www.google.com/maps/search/?api=1&query=${point.latitude},${point.longitude}`;
}

// Coordenadas da fazenda, se o ponto já foi marcado (fazendas antigas têm null; o trabalhador
// só recebe o ponto quando é o aceito no serviço).
export function pointOf(farm: { latitude?: number | null; longitude?: number | null }): GeoPoint | null {
  const { latitude, longitude } = farm;
  return latitude == null || longitude == null ? null : { latitude, longitude };
}
