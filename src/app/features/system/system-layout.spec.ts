import { MAX_BOTTOM_NAV_ITEMS, bottomNavItems } from '@core/layout/app-shell';
import { SystemPermission } from '@core/session/system-session.service';
import { systemNavItems } from './system-layout';

const ADMIN: readonly SystemPermission[] = ['users:manage', 'system-users:manage', 'tracks:oversee', 'content:manage', 'moderation:manage'];
const TUTOR: readonly SystemPermission[] = ['tracks:manage'];

describe('systemNavItems', () => {
  it('gives the admin up to 5 items, without a central action', () => {
    const bottom = bottomNavItems(systemNavItems((p) => ADMIN.includes(p)));

    expect(bottom.length).toBeLessThanOrEqual(MAX_BOTTOM_NAV_ITEMS);
    expect(bottom.some((item) => item.primary)).toBe(false);
    expect(bottom.map((item) => item.label)).toEqual(['Início', 'Usuários', 'Moderação', 'Trilhas', 'Equipe']);
  });

  it('keeps the help center, the sponsors and the profile in the sidebar only', () => {
    const all = systemNavItems((p) => ADMIN.includes(p));

    expect(all.filter((item) => item.sidebarOnly).map((item) => item.label)).toEqual(['Central de ajuda', 'Patrocínios', 'Perfil']);
  });

  it('centers "Nova trilha" for the tutor', () => {
    const bottom = bottomNavItems(systemNavItems((p) => TUTOR.includes(p)));

    expect(bottom.map((item) => item.label)).toEqual(['Início', 'Nova trilha', 'Trilhas']);
    expect(bottom.findIndex((item) => item.primary)).toBe(1);
  });
});
