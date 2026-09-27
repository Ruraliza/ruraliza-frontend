import { STATUS_META, StatusKey, statusMeta } from './status';

describe('status map', () => {
  it('translates every API status', () => {
    const expected: Record<StatusKey, string> = {
      Pending: 'Aguardando',
      'In Progress': 'Em andamento',
      Completed: 'Concluído',
      Rejected: 'Recusado',
      Cancelled: 'Cancelado',
      Accepted: 'Aceita'
    };
    for (const [status, label] of Object.entries(expected)) {
      expect(statusMeta(status as StatusKey).label).toBe(label);
    }
  });

  it('maps each status to a tone and an icon', () => {
    expect(STATUS_META.Pending).toEqual({ label: 'Aguardando', tone: 'pending', icon: 'clock' });
    expect(STATUS_META['In Progress'].tone).toBe('progress');
    expect(STATUS_META.Completed.icon).toBe('check');
    expect(STATUS_META.Rejected.tone).toBe('danger');
    expect(STATUS_META.Cancelled.icon).toBe('dash');
  });

  it('fails fast on an unknown status', () => {
    expect(() => statusMeta('Archived' as StatusKey)).toThrowError(/Archived/);
  });
});
