import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PageHeader } from '@/components/admin/page-header'
import { ResetPasswordForm } from '@/components/admin/staff/reset-password-form'
import { StaffForm } from '@/components/admin/staff/staff-form'
import { getStaffById, listShopOptions } from '@/features/staff/admin-queries'
import { requireOwner } from '@/lib/auth/session'
import { ROUTES } from '@/lib/constants/routes'
import { tr } from '@/lib/i18n/tr'

export const metadata: Metadata = { title: tr.admin.users.editTitle, robots: { index: false } }

export default async function EditUserPage({ params }: PageProps<'/admin/kullanicilar/[id]'>) {
  const { id } = await params
  const me = await requireOwner()
  const [user, shops] = await Promise.all([getStaffById(id), listShopOptions()])
  if (!user) notFound()

  return (
    <div className="mx-auto w-full max-w-2xl space-y-10">
      <PageHeader
        title={user.fullName}
        description={user.email}
        breadcrumb={
          <Link href={ROUTES.admin.users} className="hover:text-foreground">
            ← {tr.admin.users.title}
          </Link>
        }
      />
      <StaffForm mode="edit" user={user} shops={shops} isSelf={user.id === me.id} />
      <ResetPasswordForm userId={user.id} />
    </div>
  )
}
