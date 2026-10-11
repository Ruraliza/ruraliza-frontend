import { videoEmbed } from './video';

describe('videoEmbed', () => {
  it('converte o link canônico do YouTube e do Vimeo no player', () => {
    expect(videoEmbed('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toEqual({ provider: 'youtube', src: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0' });
    expect(videoEmbed('https://vimeo.com/76979871')).toEqual({ provider: 'vimeo', src: 'https://player.vimeo.com/video/76979871?dnt=1' });
  });

  it('não embute outros sites, http nem ids malformados', () => {
    for (const url of [null, '', 'https://exemplo.com/watch?v=dQw4w9WgXcQ', 'http://www.youtube.com/watch?v=dQw4w9WgXcQ', 'https://www.youtube.com/watch?v=x', 'javascript:alert(1)', 'https://vimeo.com/abc']) {
      expect(videoEmbed(url)).toBeNull();
    }
  });
});
