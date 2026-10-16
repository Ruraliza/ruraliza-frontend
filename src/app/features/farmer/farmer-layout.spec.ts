import { MAX_BOTTOM_NAV_ITEMS, bottomNavItems } from '@core/layout/app-shell';
import { farmerNavItems } from './farmer-layout';

describe('farmerNavItems', () => {
  it('fits the bottom nav in 5 items with "Novo" in the middle', () => {
    const bottom = bottomNavItems(farmerNavItems(0));

    expect(bottom.length).toBeLessThanOrEqual(MAX_BOTTOM_NAV_ITEMS);
    expect(bottom.findIndex((item) => item.primary)).toBe(Math.floor(bottom.length / 2));
    expect(bottom.map((item) => item.shortLabel ?? item.label)).toEqual(['Início', 'Serviços', 'Novo', 'Conversas', 'Fazendas']);
  });

  it('keeps the profile in the sidebar (on the phone it is the avatar) and counts unread chats', () => {
    const items = farmerNavItems(3, 2);

    expect(items.find((item) => item.label === 'Perfil')?.sidebarOnly).toBe(true);
    expect(items.find((item) => item.label === 'Conversas')?.badge).toBe(3);
    expect(items.find((item) => item.label === 'Notificações')).toMatchObject({ sidebarOnly: true, badge: 2 });
  });
});
