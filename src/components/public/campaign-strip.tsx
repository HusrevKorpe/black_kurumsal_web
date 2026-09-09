import { ROUTES } from '@/lib/constants/routes'
import { CampaignCard, type CampaignCardInput } from './campaign-card'

interface CampaignStripProps {
  campaigns: CampaignCardInput[]
}

/** Yatay kaydırmalı kampanya şeridi; yalnızca CSS (scroll-snap), JS yok. */
export function CampaignStrip({ campaigns }: CampaignStripProps) {
  return (
    <ul className="-mx-4 flex snap-x snap-mandatory [scrollbar-width:thin] gap-4 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6">
      {campaigns.map((campaign, i) => (
        <li key={campaign.id} className="w-[85%] shrink-0 snap-start sm:w-[55%] lg:w-[38%]">
          <CampaignCard campaign={campaign} fallbackHref={ROUTES.campaigns} priority={i === 0} />
        </li>
      ))}
    </ul>
  )
}
