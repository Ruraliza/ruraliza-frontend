import { ReportReason, ReportStatus, ReportTargetType } from '@core/models/report.model';

// Textos das denúncias, iguais no diálogo de quem denuncia e na fila da equipe.

export interface ReasonOption {
  value: ReportReason;
  label: string;
  hint: string;
}

const REASONS: Record<ReportReason, Omit<ReasonOption, 'value'>> = {
  fraude: { label: 'Vaga falsa ou golpe', hint: 'Pede dinheiro adiantado ou dados pessoais, ou o serviço não existe.' },
  condicoes: { label: 'Condições de trabalho ruins', hint: 'Sem equipamento de proteção, jornada pesada demais, alojamento ou pagamento indignos.' },
  comportamento: { label: 'Comportamento', hint: 'Assédio, ameaça, discriminação ou não cumpriu o combinado.' },
  ofensivo: { label: 'Conteúdo ofensivo', hint: 'Palavrões, ofensas ou fotos impróprias.' },
  outro: { label: 'Outro motivo', hint: 'Conte o que aconteceu.' }
};

// Os motivos que fazem sentido para cada alvo, na ordem da tela (a API aceita todos).
const REASONS_FOR: Record<ReportTargetType, readonly ReportReason[]> = {
  service: ['fraude', 'condicoes', 'ofensivo', 'outro'],
  farmer: ['comportamento', 'condicoes', 'fraude', 'ofensivo', 'outro'],
  worker: ['comportamento', 'fraude', 'ofensivo', 'outro']
};

export function reasonOptions(target: ReportTargetType): ReasonOption[] {
  return REASONS_FOR[target].map((value) => ({ value, ...REASONS[value] }));
}

export function reasonLabel(reason: ReportReason): string {
  return REASONS[reason].label;
}

export const REPORT_TARGET_LABEL: Record<ReportTargetType, string> = {
  service: 'Vaga',
  farmer: 'Produtor',
  worker: 'Trabalhador'
};

export const REPORT_STATUS_LABEL: Record<ReportStatus, string> = {
  open: 'Em análise',
  resolved: 'Procedente',
  dismissed: 'Descartada'
};

export const REPORT_DETAILS_MAX_LENGTH = 500;
