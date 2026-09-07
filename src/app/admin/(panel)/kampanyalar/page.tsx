import { ChevronRightIcon, PlusIcon } from 'lucide-react'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { PageHeader } from '@/components/admin/page-header'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { listCampaignsForStaff } from '@/features/campaigns/admin-queries'
import { campaignStatus, type CampaignStatus } from '@/features/campaigns/status'
import { requireStaff } from '@/lib/auth/session'
import { tr } from '@/lib/i18n/tr'
import { mediaPublicUrl } from '@/lib/media/url'
import { formatDateTr } from '@/lib/utils/format'

export const metadata: Metadata = { title: tr.admin.campaigns.title, robots: { index: false } }

const STATUS_VARIANT: Record<CampaignStatus, 'default' | 'secondary' | 'outline' | 'destructive'> =
  {
    live: 'default',
    scheduled: 'secondary',
    expired: 'outline',
    inactive: 'outline',
  }

export default async function AdminCampaignsPage() {
  const staff = await requireStaff()
  const campaigns = await listCampaignsForStaff(staff)
  const now = new Date()
  const c = tr.admin.campaigns

  return (
    <div className="mx-auto w-full max-w-5xl">
      <PageHeader
        title={c.title}
        description={staff.role === 'MANAGER' ? c.managerHint : undefined}
        actions={
          <Link href="/admin/kampanyalar/yeni" className={buttonVariants()}>
            <PlusIcon data-icon="inline-start" /> {c.newCampaign}
          </Link>
        }
      />
      {campaigns.length === 0 ? (
        <p className="text-sm text-muted-foreground">{c.empty}</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {campaigns.map((campaign) => {
            const status = campaignStatus(campaign, now)
            const target =
              campaign.shop?.name ?? campaign.location?.name ?? tr.campaigns.scopeGlobal
            return (
              <li key={campaign.id}>
                <Link
                  href={`/admin/kampanyalar/${campaign.id}`}
                  className="flex items-center gap-3 rounded-xl border bg-card p-3 transition-colors hover:bg-accent/40"
                >
                  <div className="relative aspect-video w-24 shrink-0 overflow-hidden rounded-lg bg-muted">
                    <Image
                      src={mediaPublicUrl(campaign.image)}
                      alt=""
                      fill
                      sizes="96px"
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-medium">{campaign.title}</p>
                      <Badge variant={STATUS_VARIANT[status]}>{c.status[status]}</Badge>
                    </div>
                    <p className="truncate text-xs text-muted-foreground">{target}</p>
                    {campaign.endsAt ? (
                      <p className="text-xs text-muted-foreground">
                        {tr.campaigns.validUntil(formatDateTr(campaign.endsAt))}
                      </p>
                    ) : null}
                  </div>
                  <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground" />
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
