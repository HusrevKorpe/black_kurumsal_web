import type { Metadata } from 'next'
import { CampaignForm } from '@/components/admin/campaigns/campaign-form'
import { PageHeader } from '@/components/admin/page-header'
import { listCampaignTargets } from '@/features/campaigns/admin-queries'
import { requireStaff } from '@/lib/auth/session'
import { tr } from '@/lib/i18n/tr'

export const metadata: Metadata = {
  title: tr.admin.campaigns.createTitle,
  robots: { index: false },
}

export default async function NewCampaignPage() {
  const staff = await requireStaff()
  const targets = await listCampaignTargets(staff)
  return (
    <div className="mx-auto w-full max-w-3xl">
      <PageHeader title={tr.admin.campaigns.createTitle} />
      <CampaignForm
        mode="create"
        targets={targets}
        staff={{ id: staff.id, isOwner: staff.role === 'OWNER' }}
      />
    </div>
  )
}
