import { environment } from '../../../environments/environment';
import { PhotoError, apiAsset, fitInside, preparePhoto } from './images';

describe('images', () => {
  it('shrinks to at most 1000px on the longest side, keeping the proportion', () => {
    expect(fitInside(4000, 3000)).toEqual({ width: 1000, height: 750 });
    expect(fitInside(1200, 4000)).toEqual({ width: 300, height: 1000 });
  });

  it('never enlarges small photos', () => {
    expect(fitInside(640, 480)).toEqual({ width: 640, height: 480 });
  });

  it('turns an API image path into a full URL on the API server', () => {
    const origin = new URL(environment.apiUrl).origin;
    expect(apiAsset('/api/images/x.webp')).toBe(`${origin}/api/images/x.webp`);
  });

  it('rejects files that are not images before uploading', async () => {
    const file = new File(['olá'], 'nota.txt', { type: 'text/plain' });
    await expect(preparePhoto(file)).rejects.toBeInstanceOf(PhotoError);
  });
});
