import { FarmReputation, FarmReviewScores, WorkerReputation, WorkerReviewScores } from '@core/models/review.model';

// Textos da avaliação dupla: o que cada nota mede e como mostrar a nota.

export interface Criterion<K extends string> {
  key: K;
  label: string;
  hint: string; // a pergunta que a pessoa responde ao dar a nota
}

// O produtor avalia o trabalhador.
export const WORKER_CRITERIA: readonly Criterion<keyof WorkerReviewScores>[] = [
  { key: 'punctuality', label: 'Pontualidade', hint: 'Chegou e cumpriu o horário combinado?' },
  { key: 'effort', label: 'Empenho', hint: 'Se dedicou durante o serviço?' },
  { key: 'quality', label: 'Qualidade', hint: 'O trabalho ficou bem feito?' }
];

// O trabalhador avalia a propriedade.
export const FARM_CRITERIA: readonly Criterion<keyof FarmReviewScores>[] = [
  { key: 'infrastructure', label: 'Infraestrutura', hint: 'Ferramentas, equipamentos e instalações' },
  { key: 'conditions', label: 'Condições de trabalho', hint: 'Água, sombra, EPI e segurança' },
  { key: 'as_described', label: 'Fiel ao anúncio', hint: 'O serviço foi como a vaga dizia?' }
];

// Palavra de cada nota, mostrada ao escolher as estrelas.
export const SCORE_WORDS: Readonly<Record<number, string>> = { 1: 'Ruim', 2: 'Fraco', 3: 'Regular', 4: 'Bom', 5: 'Ótimo' };

export const MAX_REVIEW_COMMENT = 500;

// 4.7 -> "4,7"
export function formatRating(value: number): string {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

export function reviewCount(count: number): string {
  return count === 1 ? '1 avaliação' : `${count} avaliações`;
}

// Texto para leitor de tela: "Nota 4,7 de 5, em 12 avaliações".
export function ratingLabel(reputation: { average: number | null; count: number }): string {
  return reputation.average === null
    ? 'Ainda sem avaliações'
    : `Nota ${formatRating(reputation.average)} de 5, em ${reviewCount(reputation.count)}`;
}

// Mais bem avaliados primeiro (a nota de ordenação da API já pesa a quantidade de avaliações).
export function byReputation<T extends { reputation: WorkerReputation | FarmReputation }>(a: T, b: T): number {
  return b.reputation.score - a.reputation.score;
}
