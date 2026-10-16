import { AppNotification } from '@core/models/notification.model';
import { groupByDay, notificationIcon } from './notification-list';

const at = (id: number, iso: string): AppNotification => ({ id, title: 't', body: 'b', url: 'produtor/servicos/1', count: 1, read: false, insertion_date: iso });

describe('notification list helpers', () => {
  it('groups the alerts by day, keeping the newest first', () => {
    const now = new Date('2026-10-16T15:00:00.000Z');
    const groups = groupByDay([at(3, '2026-10-16T14:00:00.000Z'), at(2, '2026-10-16T09:00:00.000Z'), at(1, '2026-10-15T12:00:00.000Z')], now);

    expect(groups.map((g) => [g.label, g.items.map((n) => n.id)])).toEqual([['Hoje', [3, 2]], ['Ontem', [1]]]);
  });

  it('picks the icon from the screen the alert opens', () => {
    expect(notificationIcon('produtor/conversas/4')).toBe('chat');
    expect(notificationIcon('produtor/servicos/12')).toBe('list');
    expect(notificationIcon('trabalhador/candidaturas')).toBe('briefcase');
    expect(notificationIcon('trabalhador/vagas/3')).toBe('briefcase');
    expect(notificationIcon('trabalhador/ajuda')).toBe('shield');
    expect(notificationIcon('qualquer/outra')).toBe('bell');
  });
});
