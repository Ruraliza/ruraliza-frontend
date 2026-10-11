// Markdown simples das aulas, convertido em HTML seguro. Todo o texto é escapado antes; só então
// as marcações conhecidas viram tags, então nenhum HTML do autor chega à página.
// Aceita: parágrafos, ## e ### (títulos), listas com "-" ou "1.", **negrito**, *itálico* e
// [links](https://...) (só http/https, abrem em outra aba).

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function inline(text: string): string {
  return escapeHtml(text)
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>');
}

export function renderMarkdown(source: string): string {
  const html: string[] = [];
  let paragraph: string[] = [];
  // Num objeto: o TypeScript não acompanha atribuições feitas dentro das funções abaixo.
  const open: { list: { tag: 'ul' | 'ol'; items: string[] } | null } = { list: null };

  const flushParagraph = (): void => {
    if (paragraph.length) html.push(`<p>${paragraph.map(inline).join('<br>')}</p>`);
    paragraph = [];
  };
  const flushList = (): void => {
    const list = open.list;
    if (list) html.push(`<${list.tag}>${list.items.map((item) => `<li>${inline(item)}</li>`).join('')}</${list.tag}>`);
    open.list = null;
  };

  for (const raw of source.replace(/\r\n?/g, '\n').split('\n')) {
    const line = raw.trim();
    const heading = /^(#{2,3})\s+(.+)$/.exec(line);
    const bullet = /^[-*]\s+(.+)$/.exec(line);
    const numbered = /^\d+[.)]\s+(.+)$/.exec(line);

    if (!line) {
      flushParagraph();
      flushList();
    } else if (heading) {
      flushParagraph();
      flushList();
      const level = heading[1] === '##' ? 'h2' : 'h3';
      html.push(`<${level}>${inline(heading[2] ?? '')}</${level}>`);
    } else if (bullet || numbered) {
      flushParagraph();
      const tag = bullet ? 'ul' : 'ol';
      if (open.list?.tag !== tag) {
        flushList();
        open.list = { tag, items: [] };
      }
      open.list.items.push((bullet ?? numbered)?.[1] ?? '');
    } else {
      flushList();
      paragraph.push(line);
    }
  }
  flushParagraph();
  flushList();
  return html.join('');
}
