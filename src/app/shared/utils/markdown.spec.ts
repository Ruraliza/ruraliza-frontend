import { renderMarkdown } from './markdown';

describe('renderMarkdown', () => {
  it('converte títulos, parágrafos, listas, negrito, itálico e links', () => {
    const md = '## Ponto\n\nColha quando **80%** estiver *cereja*.\nSegunda linha.\n\n- luvas\n- chapéu\n\n1. Estenda\n2. Puxe\n\nVeja [o guia](https://exemplo.com/guia).';
    expect(renderMarkdown(md)).toBe(
      '<h2>Ponto</h2>' +
      '<p>Colha quando <strong>80%</strong> estiver <em>cereja</em>.<br>Segunda linha.</p>' +
      '<ul><li>luvas</li><li>chapéu</li></ul>' +
      '<ol><li>Estenda</li><li>Puxe</li></ol>' +
      '<p>Veja <a href="https://exemplo.com/guia" target="_blank" rel="noopener noreferrer">o guia</a>.</p>'
    );
  });

  it('escapa HTML do autor e recusa links que não são http(s)', () => {
    const html = renderMarkdown('<script>alert(1)</script> <img src=x onerror=alert(1)>\n\n[clique](javascript:alert(1))');
    expect(html).not.toContain('<script');
    expect(html).not.toContain('<img');
    expect(html).not.toContain('href="javascript');
    expect(html).toContain('&lt;script&gt;');
  });

  it('não deixa aspas quebrarem o atributo do link', () => {
    expect(renderMarkdown('[x](https://a.com/"onmouseover="alert(1))')).not.toContain('"onmouseover');
  });
});
