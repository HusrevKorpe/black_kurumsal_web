import type { Metadata } from 'next'
import { PageHeader } from '@/components/admin/page-header'
import { StaffForm } from '@/components/admin/staff/staff-form'
import { listShopOptions } from '@/features/staff/admin-queries'
import { requireOwner } from '@/lib/auth/session'
import { tr } from '@/lib/i18n/tr'

export const metadata: Metadata = { title: tr.admin.users.createTitle, robots: { index: false } }

export default async function NewUserPage() {
  await requireOwner()
  const shops = await listShopOptions()
  return (
    <div className="mx-auto w-full max-w-2xl">
      <PageHeader title={tr.admin.users.createTitle} />
      <StaffForm mode="create" shops={shops} />
    </div>
  )
}
