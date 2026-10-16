import { MAX_BOTTOM_NAV_ITEMS, bottomNavItems } from '@core/layout/app-shell';
import { workerNavItems } from './worker-layout';

describe('workerNavItems', () => {
  it('fits the bottom nav in 5 items with "Buscar" in the middle', () => {
    const bottom = bottomNavItems(workerNavItems(0));

    expect(bottom.length).toBeLessThanOrEqual(MAX_BOTTOM_NAV_ITEMS);
    expect(bottom.findIndex((item) => item.primary)).toBe(Math.floor(bottom.length / 2));
    expect(bottom.map((item) => item.label)).toEqual(['Início', 'Candidaturas', 'Buscar', 'Conversas', 'Trilhas']);
  });

  it('keeps "Vagas" and the profile only in the sidebar', () => {
    const sidebarOnly = workerNavItems(0).filter((item) => item.sidebarOnly).map((item) => item.label);

    expect(sidebarOnly).toEqual(['Vagas', 'Notificações', 'Perfil', 'Ajuda']);
  });
});
