import { environment } from '@env/environment';
import { PhotoError, apiAsset, centeredCrop, clampCrop, fitInside, preparePhoto, resizeCrop } from './images';

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

  describe('square crop', () => {
    it('starts with the largest centered square', () => {
      expect(centeredCrop(4000, 3000)).toEqual({ x: 500, y: 0, size: 3000 });
      expect(centeredCrop(1200, 1600)).toEqual({ x: 0, y: 200, size: 1200 });
    });

    it('keeps the square inside the photo', () => {
      expect(clampCrop({ x: -50, y: 2800, size: 1000 }, 4000, 3000)).toEqual({ x: 0, y: 2000, size: 1000 });
      expect(clampCrop({ x: 100, y: 100, size: 5000 }, 4000, 3000)).toEqual({ x: 100, y: 0, size: 3000 });
    });

    it('zooms around the center of the current square', () => {
      expect(resizeCrop({ x: 1000, y: 1000, size: 1000 }, 500, 4000, 3000)).toEqual({ x: 1250, y: 1250, size: 500 });
    });

    it('slides back inside when zooming out near an edge', () => {
      expect(resizeCrop({ x: 0, y: 0, size: 500 }, 1000, 4000, 3000)).toEqual({ x: 0, y: 0, size: 1000 });
    });
  });
});
