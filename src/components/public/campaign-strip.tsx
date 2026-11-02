import { ROUTES } from '@/lib/constants/routes'
import { CampaignCard, type CampaignCardInput } from './campaign-card'

interface CampaignStripProps {
  campaigns: CampaignCardInput[]
}

/** Telefonda parmakla kayan şerit (CSS scroll-snap), geniş ekranda ızgara. */
export function CampaignStrip({ campaigns }: CampaignStripProps) {
  return (
    <ul className="-mx-4 flex snap-x snap-mandatory [scrollbar-width:none] gap-3 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6 lg:mx-0 lg:grid lg:grid-cols-3 lg:gap-6 lg:overflow-visible lg:px-0">
      {campaigns.map((campaign) => (
        <li key={campaign.id} className="w-[85%] shrink-0 snap-start sm:w-[55%] lg:w-auto">
          <CampaignCard campaign={campaign} fallbackHref={ROUTES.campaigns} />
        </li>
      ))}
    </ul>
  )
}
