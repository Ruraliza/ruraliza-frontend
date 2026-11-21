// Confere o contraste das cores de src/styles/tokens.css nos quatro temas (claro, escuro, alto contraste
// e escuro com alto contraste), pela fórmula da WCAG 2.x:
// - texto: 4,5:1 sobre o fundo da página e o dos cartões (AA para texto normal);
// - borda de campo: 3:1 sobre os mesmos fundos (componente de interface);
// - texto sobre preenchimento (botões, chips, faixas): 4,5:1.
// Os pares vêm do uso real nos componentes (`color: var(--...)`). Sem dependências; falha com a lista dos pares abaixo do mínimo.
// Uso: npm run check:contrast (também roda no npm run verify).
import { readFile } from 'node:fs/promises';

const TOKENS = new URL('../src/styles/tokens.css', import.meta.url);

// Seletores na ordem em que o tema se compõe: cada um herda os anteriores (mesma ordem da cascata do CSS).
const THEMES = {
  claro: [':root'],
  escuro: [':root', ':root[data-theme="dark"]'],
  'alto contraste': [':root', ':root[data-contrast="high"]'],
  'escuro com alto contraste': [':root', ':root[data-theme="dark"]', ':root[data-contrast="high"]', ':root[data-theme="dark"][data-contrast="high"]']
};

const BACKGROUNDS = ['--bg', '--surface-raised'];
const TEXT = ['--ink', '--ink-muted', '--mata', '--danger', '--success', '--orange-700', '--warning', '--money', '--info'];
const FIELD_BORDERS = ['--line-strong'];
const ON_FILL = [
  ['--on-mata', '--mata'],
  ['--on-broto', '--broto'],
  ['--on-accent', '--lime-500'],
  ['--on-accent', '--orange-500'],
  ['--on-accent', '--gold-500'],
  ['--on-dark', '--green-900'],
  ['--on-dark', '--green-700']
];

const TEXT_MIN = 4.5;
const BORDER_MIN = 3;

function parseBlocks(css) {
  const blocks = new Map();
  const clean = css.replace(/\/\*[\s\S]*?\*\//g, '');
  for (const [, selector, body] of clean.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const vars = {};
    for (const declaration of body.split(';')) {
      const match = /^\s*(--[\w-]+)\s*:\s*(.+?)\s*$/.exec(declaration);
      if (match) vars[match[1]] = match[2];
    }
    blocks.set(selector.trim(), vars);
  }
  return blocks;
}

function themeVars(blocks, selectors) {
  const vars = {};
  for (const selector of selectors) {
    const block = blocks.get(selector);
    if (!block) throw new Error(`Seletor não encontrado em tokens.css: ${selector}`);
    Object.assign(vars, block);
  }
  return vars;
}

function resolve(vars, name, seen = new Set()) {
  if (seen.has(name)) throw new Error(`Referência circular em ${name}`);
  seen.add(name);
  const value = vars[name];
  if (value === undefined) throw new Error(`Token não definido: ${name}`);
  const ref = /^var\((--[\w-]+)\)$/.exec(value);
  return ref ? resolve(vars, ref[1], seen) : value;
}

function luminance(hex) {
  const match = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!match) throw new Error(`Cor que não é #RRGGBB: ${hex}`);
  const [r, g, b] = [0, 2, 4].map((i) => {
    const channel = parseInt(match[1].slice(i, i + 2), 16) / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function ratio(a, b) {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}

const blocks = parseBlocks(await readFile(TOKENS, 'utf8'));
const failures = [];
let checked = 0;

for (const [theme, selectors] of Object.entries(THEMES)) {
  const vars = themeVars(blocks, selectors);
  const check = (fg, bg, min) => {
    checked++;
    const value = ratio(resolve(vars, fg), resolve(vars, bg));
    if (value < min) failures.push(`${theme}: ${fg} sobre ${bg} = ${value.toFixed(2)}:1 (mínimo ${min}:1)`);
  };
  for (const bg of BACKGROUNDS) {
    for (const fg of TEXT) check(fg, bg, TEXT_MIN);
    for (const fg of FIELD_BORDERS) check(fg, bg, BORDER_MIN);
  }
  for (const [fg, bg] of ON_FILL) check(fg, bg, TEXT_MIN);
}

if (failures.length > 0) {
  console.error(`Contraste abaixo do mínimo em ${failures.length} de ${checked} pares:\n- ${failures.join('\n- ')}`);
  process.exitCode = 1;
} else {
  console.log(`Contraste conferido: ${checked} pares nos ${Object.keys(THEMES).length} temas.`);
}
