import { ExternalLinkIcon, LogOutIcon } from 'lucide-react'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Toaster } from '@/components/ui/sonner'
import type { StaffRole } from '@/generated/prisma/enums'
import { ROUTES } from '@/lib/constants/routes'
import { tr } from '@/lib/i18n/tr'
import { navItemsForRole } from './admin-nav'
import { AdminNavLinks } from './admin-nav-links'

interface AdminShellProps {
  staff: { fullName: string; role: StaffRole }
  children: ReactNode
}

/**
 * Mobil öncelikli panel kabuğu: telefonda üst bar + alt sekme çubuğu, geniş ekranda sol menü.
 */
export function AdminShell({ staff, children }: AdminShellProps) {
  const items = navItemsForRole(staff.role)

  return (
    <div className="flex min-h-full flex-1">
      <aside className="hidden w-60 shrink-0 flex-col border-r bg-card lg:flex">
        <div className="flex h-16 items-center gap-2 border-b px-5">
          <span className="inline-flex size-8 items-center justify-center rounded-md bg-brand font-bold text-brand-foreground">
            B
          </span>
          <span className="font-semibold">{tr.admin.title}</span>
        </div>
        <AdminNavLinks items={items} variant="sidebar" />
        <div className="mt-auto border-t p-4 text-sm">
          <p className="truncate font-medium">{staff.fullName}</p>
          <p className="text-xs text-muted-foreground">{tr.admin.roles[staff.role]}</p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b bg-background/90 px-4 backdrop-blur sm:h-16 sm:px-6">
          <div className="flex items-center gap-2 lg:hidden">
            <span className="inline-flex size-7 items-center justify-center rounded-md bg-brand text-sm font-bold text-brand-foreground">
              B
            </span>
            <span className="text-sm font-semibold">{tr.admin.title}</span>
          </div>
          <div className="ml-auto flex items-center gap-1">
            <Link
              href={ROUTES.home}
              target="_blank"
              className="hidden items-center gap-1.5 px-2 text-sm text-muted-foreground hover:text-foreground sm:inline-flex"
            >
              <ExternalLinkIcon className="size-4" /> {tr.admin.nav.viewSite}
            </Link>
            <form action={ROUTES.admin.signOut} method="post">
              <Button type="submit" variant="ghost" size="sm" aria-label={tr.admin.nav.signOut}>
                <LogOutIcon data-icon="inline-start" />{' '}
                <span className="hidden sm:inline">{tr.admin.nav.signOut}</span>
              </Button>
            </form>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 pb-24 sm:px-6 lg:pb-8">{children}</main>

        <AdminNavLinks items={items} variant="bottom" />
      </div>
      <Toaster position="top-center" richColors closeButton />
    </div>
  )
}
