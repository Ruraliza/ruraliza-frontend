import type { ChatDetail } from '@core/models/chat.model';
import type { AgreementTerms, PriceUnit } from '@core/models/service.model';
import type { Proposal, ProposalStatus } from '@core/models/service-application.model';
import { formatBRL } from '@shared/utils/format';

// Vaga antiga, sem valor estimado: o valor é todo combinado na conversa.
export const PRICE_TO_AGREE = 'Valor a combinar';
export const FINAL_PRICE_NOTE = 'valor final combinado na conversa';

// Os valores vêm em inglês da API; aqui, o texto de cada um.
export const UNIT_OPTIONS: readonly { value: PriceUnit; label: string; per: string }[] = [
  { value: 'day', label: 'Por dia', per: 'por dia' },
  { value: 'hour', label: 'Por hora', per: 'por hora' },
  { value: 'fixed', label: 'Empreitada (valor fechado)', per: 'pela empreitada' },
  { value: 'hectare', label: 'Por hectare', per: 'por hectare' },
  { value: 'meter', label: 'Por metro', per: 'por metro' }
];
export const PROPOSAL_STATUS_LABEL: Record<ProposalStatus, string> = {
  Pending: 'Aguardando resposta',
  Accepted: 'Aceita',
  Declined: 'Recusada',
  Superseded: 'Substituída'
};

// "R$ 150,00 por dia"
export function priceLabel(terms: Pick<AgreementTerms, 'amount' | 'unit'>): string {
  return `${formatBRL(terms.amount)} ${UNIT_OPTIONS.find((u) => u.value === terms.unit)?.per ?? ''}`.trim();
}

// A estimativa da vaga: "Estimativa: R$ 150,00 por dia", ou "Valor a combinar" nas vagas antigas.
export function estimateLabel(service: { price: number | null; price_unit: PriceUnit | null }): string {
  return service.price !== null && service.price_unit !== null
    ? `Estimativa: ${priceLabel({ amount: service.price, unit: service.price_unit })}`
    : PRICE_TO_AGREE;
}

// O valor de um serviço como quem vê o enxerga: o combinado (produtor e trabalhador aceito) ou a estimativa.
export function servicePrice(service: { agreement: AgreementTerms | null; price: number | null; price_unit: PriceUnit | null }): string {
  return service.agreement ? priceLabel(service.agreement) : estimateLabel(service);
}

// O total sugerido ao liberar o pagamento, a partir da proposta aceita: na empreitada é o próprio valor; por hora,
// valor × horas do serviço. Nas outras unidades não dá para saber a quantidade, e o produtor digita (null).
export function suggestedTotal(agreement: Pick<AgreementTerms, 'amount' | 'unit'> | null, hours: number): number | null {
  if (!agreement) return null;
  if (agreement.unit === 'fixed') return agreement.amount;
  if (agreement.unit === 'hour') return Math.round(agreement.amount * hours * 100) / 100;
  return null;
}

// Em que mensagem da conversa aparece o cartão de cada proposta: na primeira que fala dela (a da proposta);
// as respostas seguintes ficam como aviso simples.
export function proposalCards(chat: ChatDetail | null): Map<number, Proposal> {
  const cards = new Map<number, Proposal>();
  const shown = new Set<number>();
  for (const message of chat?.messages ?? []) {
    const proposal = message.proposal_id === undefined ? undefined : chat?.proposals.find((p) => p.id === message.proposal_id);
    if (!proposal || shown.has(proposal.id)) continue;
    shown.add(proposal.id);
    cards.set(message.id, proposal);
  }
  return cards;
}
