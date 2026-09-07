import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CampaignDangerZone } from '@/components/admin/campaigns/campaign-danger-zone'
import { CampaignForm } from '@/components/admin/campaigns/campaign-form'
import { PageHeader } from '@/components/admin/page-header'
import { getCampaignForAdmin, listCampaignTargets } from '@/features/campaigns/admin-queries'
import { requireStaff } from '@/lib/auth/session'
import { ROUTES } from '@/lib/constants/routes'
import { tr } from '@/lib/i18n/tr'

export const metadata: Metadata = { title: tr.admin.campaigns.editTitle, robots: { index: false } }

export default async function EditCampaignPage({ params }: PageProps<'/admin/kampanyalar/[id]'>) {
  const { id } = await params
  const staff = await requireStaff()
  const [campaign, targets] = await Promise.all([
    getCampaignForAdmin(staff, id),
    listCampaignTargets(staff),
  ])
  if (!campaign) notFound()

  return (
    <div className="mx-auto w-full max-w-3xl space-y-10">
      <PageHeader
        title={campaign.title}
        breadcrumb={
          <Link href={ROUTES.admin.campaigns} className="hover:text-foreground">
            ← {tr.admin.campaigns.title}
          </Link>
        }
      />
      <CampaignForm
        mode="edit"
        campaign={campaign}
        targets={targets}
        staff={{ id: staff.id, isOwner: staff.role === 'OWNER' }}
      />
      <CampaignDangerZone campaignId={campaign.id} title={campaign.title} />
    </div>
  )
}
