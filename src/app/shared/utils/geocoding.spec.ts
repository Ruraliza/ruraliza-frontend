import { formatPoint, mapsLink, parseGeocoderResult, pointOf } from './geocoding';

const component = (long_name: string, short_name: string, ...types: string[]) => ({ long_name, short_name, types });

describe('geocoding', () => {
  it('reads street, number, city and UF from a reverse geocoding result', () => {
    const result = {
      address_components: [
        component('120', '120', 'street_number'),
        component('Rua Barão do Rio Branco', 'R. Barão do Rio Branco', 'route'),
        component('Três Rios', 'Três Rios', 'administrative_area_level_2', 'political'),
        component('Rio de Janeiro', 'RJ', 'administrative_area_level_1', 'political'),
        component('Brasil', 'BR', 'country', 'political')
      ]
    };
    expect(parseGeocoderResult(result)).toEqual({ address: 'Rua Barão do Rio Branco, 120', city: 'Três Rios', state: 'RJ' });
  });

  it('keeps only the road when there is no number and falls back to locality for the city', () => {
    const result = {
      address_components: [
        component('Rodovia BR-040', 'BR-040', 'route'),
        component('Paraíba do Sul', 'Paraíba do Sul', 'locality', 'political'),
        component('Rio de Janeiro', 'RJ', 'administrative_area_level_1')
      ]
    };
    expect(parseGeocoderResult(result)).toEqual({ address: 'Rodovia BR-040', city: 'Paraíba do Sul', state: 'RJ' });
  });

  it('leaves fields empty when the point is outside Brazil or has no road', () => {
    const result = { address_components: [component('Buenos Aires', 'Buenos Aires', 'administrative_area_level_1')] };
    expect(parseGeocoderResult(result)).toEqual({ address: '', city: '', state: '' });
  });

  it('formats the point and builds a Google Maps link', () => {
    const point = { latitude: -22.1165, longitude: -43.2092 };
    expect(formatPoint(point)).toBe('-22.11650, -43.20920');
    expect(mapsLink(point)).toBe('https://www.google.com/maps/search/?api=1&query=-22.1165,-43.2092');
  });

  it('only returns a point when both coordinates exist', () => {
    expect(pointOf({ latitude: 1, longitude: 2 })).toEqual({ latitude: 1, longitude: 2 });
    expect(pointOf({ latitude: null, longitude: null })).toBeNull();
    expect(pointOf({})).toBeNull();
  });
});
