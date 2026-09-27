import { Params } from '@angular/router';

// Rascunho de vaga montado na landing ("Monte uma vaga"). Viaja por query params:
// landing → cadastro de produtor → (fazenda) → formulário de novo serviço.
export interface ServiceDraft {
  servico?: string;
  categoria?: string;
  duracao?: string;
  valor?: string;
}

export const DRAFT_KEYS = ['servico', 'categoria', 'duracao', 'valor'] as const;

// Só os campos preenchidos, para não sujar a URL.
export function draftParams(draft: ServiceDraft): Params {
  return Object.fromEntries(DRAFT_KEYS.filter((k) => draft[k]).map((k) => [k, draft[k]]));
}

export function hasDraft(draft: ServiceDraft): boolean {
  return DRAFT_KEYS.some((k) => !!draft[k]);
}

// Converte "40" / "1800.5" em número positivo, ou null se inválido.
export function draftNumber(value: string | undefined): number | null {
  const n = Number(value);
  return value && Number.isFinite(n) && n > 0 ? n : null;
}
