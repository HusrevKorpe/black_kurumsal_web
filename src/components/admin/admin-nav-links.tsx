'use client'

import type { LucideIcon } from 'lucide-react'
import {
  ClipboardListIcon,
  HomeIcon,
  MapPinIcon,
  MegaphoneIcon,
  SettingsIcon,
  StoreIcon,
  Trash2Icon,
  UsersIcon,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import type { AdminNavIcon, AdminNavItem } from './admin-nav'

const ICONS: Record<AdminNavIcon, LucideIcon> = {
  home: HomeIcon,
  store: StoreIcon,
  megaphone: MegaphoneIcon,
  'map-pin': MapPinIcon,
  users: UsersIcon,
  settings: SettingsIcon,
  'clipboard-list': ClipboardListIcon,
  trash: Trash2Icon,
}

interface AdminNavLinksProps {
  items: AdminNavItem[]
  variant: 'sidebar' | 'bottom'
}

function isActive(pathname: string, href: string) {
  if (href === '/admin') return pathname === '/admin'
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function AdminNavLinks({ items, variant }: AdminNavLinksProps) {
  const pathname = usePathname()

  if (variant === 'bottom') {
    // Telefonda alt sekme çubuğu: en fazla 5 madde sığar, kalanlar menüde.
    const visible = items.slice(0, 5)
    return (
      <nav
        aria-label="Panel menüsü"
        className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
      >
        <ul
          className="grid"
          style={{ gridTemplateColumns: `repeat(${visible.length}, minmax(0, 1fr))` }}
        >
          {visible.map((item) => {
            const active = isActive(pathname, item.href)
            const Icon = ICONS[item.icon]
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex flex-col items-center gap-1 py-2 text-[11px] font-medium',
                    active ? 'text-brand' : 'text-muted-foreground',
                  )}
                >
                  <Icon className="size-5" />
                  <span className="truncate">{item.label}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    )
  }

  return (
    <nav aria-label="Panel menüsü" className="flex-1 space-y-1 p-3">
      {items.map((item) => {
        const active = isActive(pathname, item.href)
        const Icon = ICONS[item.icon]
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              active
                ? 'bg-accent text-foreground'
                : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground',
            )}
          >
            <Icon className="size-4" />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
