// Texto para busca sem diferenciar acentos nem maiúsculas ("Ação" e "acao" batem).
export function searchable(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

// Todas as palavras da busca aparecem no texto (em qualquer ordem).
export function matchesAllWords(text: string, query: string): boolean {
  const haystack = searchable(text);
  return searchable(query).split(/\s+/).filter(Boolean).every((word) => haystack.includes(word));
}
