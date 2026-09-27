// Status chegam em inglês da API e são traduzidos só aqui, na UI.

export type ServiceStatus = 'Pending' | 'In Progress' | 'Completed' | 'Rejected' | 'Cancelled';
export type ApplicationStatus = 'Pending' | 'Accepted' | 'Rejected';
export type PaymentStatus = 'Completed';

export type StatusKey = ServiceStatus | ApplicationStatus;
export type StatusTone = 'pending' | 'progress' | 'success' | 'danger' | 'neutral';
export type StatusIcon = 'clock' | 'play' | 'check' | 'x' | 'dash';

export interface StatusMeta {
  label: string;
  tone: StatusTone;
  icon: StatusIcon;
}

export const STATUS_META: Record<StatusKey, StatusMeta> = {
  Pending: { label: 'Aguardando', tone: 'pending', icon: 'clock' },
  'In Progress': { label: 'Em andamento', tone: 'progress', icon: 'play' },
  Completed: { label: 'Concluído', tone: 'success', icon: 'check' },
  Rejected: { label: 'Recusado', tone: 'danger', icon: 'x' },
  Cancelled: { label: 'Cancelado', tone: 'neutral', icon: 'dash' },
  Accepted: { label: 'Aceita', tone: 'success', icon: 'check' }
};

export function statusMeta(status: StatusKey): StatusMeta {
  const meta = STATUS_META[status];
  if (!meta) {
    throw new Error(`Status desconhecido recebido da API: "${status}".`);
  }
  return meta;
}
