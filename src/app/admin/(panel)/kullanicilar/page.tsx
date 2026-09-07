import { ChevronRightIcon, PlusIcon } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { PageHeader } from '@/components/admin/page-header'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { listStaff } from '@/features/staff/admin-queries'
import { requireOwner } from '@/lib/auth/session'
import { tr } from '@/lib/i18n/tr'

export const metadata: Metadata = { title: tr.admin.users.title, robots: { index: false } }

export default async function AdminUsersPage() {
  const me = await requireOwner()
  const users = await listStaff()
  const u = tr.admin.users

  return (
    <div className="mx-auto w-full max-w-4xl">
      <PageHeader
        title={u.title}
        actions={
          <Link href="/admin/kullanicilar/yeni" className={buttonVariants()}>
            <PlusIcon data-icon="inline-start" /> {u.newUser}
          </Link>
        }
      />
      <ul className="divide-y rounded-xl border">
        {users.map((user) => (
          <li key={user.id}>
            <Link
              href={`/admin/kullanicilar/${user.id}`}
              className="flex items-center gap-3 p-3 transition-colors hover:bg-accent/40"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate font-medium">
                    {user.fullName}
                    {user.id === me.id ? (
                      <span className="text-xs text-muted-foreground"> ({u.you})</span>
                    ) : null}
                  </p>
                  <Badge variant={user.role === 'OWNER' ? 'default' : 'secondary'}>
                    {tr.admin.roles[user.role]}
                  </Badge>
                  {!user.isActive ? <Badge variant="outline">{tr.common.inactive}</Badge> : null}
                </div>
                <p className="truncate text-xs text-muted-foreground">
                  {user.email}
                  {' · '}
                  {user.role === 'OWNER'
                    ? u.allShops
                    : user.assignments.map((a) => a.shop.name).join(', ') || u.assignedCount(0)}
                </p>
              </div>
              <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
