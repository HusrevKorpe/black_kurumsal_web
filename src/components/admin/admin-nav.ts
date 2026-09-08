import type { StaffRole } from '@/generated/prisma/enums'
import { ROUTES } from '@/lib/constants/routes'
import { tr } from '@/lib/i18n/tr'

/** İkonlar ada göre istemci tarafında çözülür; sunucudan istemciye fonksiyon geçmez. */
export type AdminNavIcon =
  'home' | 'chart' | 'store' | 'megaphone' | 'map-pin' | 'users' | 'settings' | 'clipboard-list'

export interface AdminNavItem {
  href: `/${string}`
  label: string
  icon: AdminNavIcon
  ownerOnly?: boolean
}

export const ADMIN_NAV: AdminNavItem[] = [
  { href: ROUTES.admin.root, label: tr.admin.nav.dashboard, icon: 'home' },
  { href: ROUTES.admin.shops, label: tr.admin.nav.shops, icon: 'store' },
  { href: ROUTES.admin.campaigns, label: tr.admin.nav.campaigns, icon: 'megaphone' },
  { href: ROUTES.admin.locations, label: tr.admin.nav.locations, icon: 'map-pin', ownerOnly: true },
  { href: ROUTES.admin.users, label: tr.admin.nav.users, icon: 'users', ownerOnly: true },
  // Telefonda alt çubuğa yalnızca ilk 5 madde sığar; buraya eklenirse Kullanıcılar düşerdi.
  // İstatistiğe telefondan özet sayfasındaki karttan girilir.
  { href: ROUTES.admin.analytics, label: tr.admin.nav.analytics, icon: 'chart', ownerOnly: true },
  { href: ROUTES.admin.settings, label: tr.admin.nav.settings, icon: 'settings', ownerOnly: true },
  { href: ROUTES.admin.audit, label: tr.admin.nav.audit, icon: 'clipboard-list', ownerOnly: true },
]

export function navItemsForRole(role: StaffRole): AdminNavItem[] {
  return ADMIN_NAV.filter((item) => !item.ownerOnly || role === 'OWNER')
}
