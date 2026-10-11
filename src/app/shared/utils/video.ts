// Player embutido das aulas: só YouTube e Vimeo (a API já guarda o link no formato canônico,
// https://www.youtube.com/watch?v=ID ou https://vimeo.com/ID). Qualquer outra coisa não vira iframe.

export interface VideoEmbed {
  provider: 'youtube' | 'vimeo';
  src: string;
}

export function videoEmbed(url: string | null): VideoEmbed | null {
  if (!url) return null;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (parsed.protocol !== 'https:') return null;
  const host = parsed.hostname.toLowerCase();

  if (host === 'www.youtube.com' || host === 'youtube.com') {
    const id = parsed.pathname === '/watch' ? parsed.searchParams.get('v') : null;
    // youtube-nocookie: sem cookies de rastreio até a pessoa dar play.
    return id && /^[A-Za-z0-9_-]{11}$/.test(id) ? { provider: 'youtube', src: `https://www.youtube-nocookie.com/embed/${id}?rel=0` } : null;
  }
  if (host === 'vimeo.com' || host === 'www.vimeo.com') {
    const id = parsed.pathname.slice(1);
    return /^\d{6,12}$/.test(id) ? { provider: 'vimeo', src: `https://player.vimeo.com/video/${id}?dnt=1` } : null;
  }
  return null;
}
